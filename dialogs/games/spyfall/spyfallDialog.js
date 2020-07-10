// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog, WaterfallDialog, ChoicePrompt } = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder-core');
const {
  getIdentityCard,
  getSpyActionCard,
  getDetectiveActionCard } = require('../../../helpers/games/spyfallCard');
const { getRandomInt } = require('../../../helpers/thumbnail');
const { actionCardId } = require('../../../helpers/updatableId');
const { spyfallEndGamehelper } = require('../../../helpers/games/spyfall');
const constants = require('../../../config/constants');
const Resolvers = require('../../../resolvers');

let votedPlayerSet = new Set();
let spyIndex;

class SpyfallDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.SPYFALL_DIALOG);
    this._luisRecognizer = luisRecognizer;

    this.addDialog(new ChoicePrompt(constants.SPYFALL_PROMPT));
    this.addDialog(
      new WaterfallDialog(constants.SPYFALL_WATERFALL_DIALOG, [
        this.startGameSession.bind(this),
        this.registerCountdown.bind(this),
        this.distributeRoleStep.bind(this),
        this.restartStep.bind(this)
      ])
    );

    this._spyfallRoles = null;
    this.initialDialogId = constants.SPYFALL_WATERFALL_DIALOG;
  }

  async startGameSession(stepContext) {
    if (stepContext.context.activity.value) {
      stepContext.options.sessionCode = stepContext.context.activity.value.sessionCode;
    }

    // Initialize game data
    if (!this._spyfallRoles) {
      this._spyfallRoles = await Resolvers.game.getSpyfallMetadata();
    }

    // TODO: lifespan should be adjustable based on the number of players
    votedPlayerSet.clear();
    const sessionCode = stepContext.options.sessionCode;
    const lifespan = constants.DEFAULT_SPYFALL_LIFESPAN_SEC;

    await Resolvers.proactiveMessage.notifySession(
      sessionCode,
      `**Spyfall ${sessionCode} is now started, try to find the spy in ${lifespan} seconds!**`
    );

    await Resolvers.gameSession.startSession({
      code: sessionCode,
      lifespanSec: lifespan
    });

    return stepContext.next();
  }

  async registerCountdown(stepContext) {
    // Only the host needs to register the countdown timer
    const sessionCode = stepContext.options.sessionCode;

    // To prevent the host from keep clicking on the proactive card
    // We should only register the timer once at a time
    await Resolvers.countdown.register(
      sessionCode,
      constants.DEFAULT_COUNTDOWN_INTERVAL_SEC,
      async () => {
        spyfallEndGamehelper({
          code: sessionCode,
          res: 'timeout',
          spyIdx: spyIndex
        });
      }
    );

    return await stepContext.next();
  }

  async distributeRoleStep(stepContext) {
    let session = await Resolvers.gameSession.getSession({ code: stepContext.options.sessionCode });
    const location = this._spyfallRoles.locations[getRandomInt(this._spyfallRoles.locations.length)];
    const displayLocation = this._spyfallRoles[`location.${location}`];
    spyIndex = getRandomInt(session.players.length + 1);
    let voteChoices = session.players.map(p => {
      return { title: p.name, value: p.aad};
    });
    voteChoices.push({
      title: session.host.name,
      value: session.host.aad
    });

    session.players.push(session.host);

    session.players.forEach(async (player, index) => {
      const filteredVoteChoices = voteChoices.filter(choice => choice.title !== player.name);
      const sessionCode = stepContext.options.sessionCode;

      // Don't use 'let' statement here, await will cause context switch
      let identityCard;
      let actionCard
      if (index === spyIndex) {
        identityCard = this.renderSpyCard();
        actionCard = this.renderSpyActionCard(sessionCode, spyIndex, displayLocation);
      } else {
        identityCard = this.renderDetectiveCard(index, spyIndex, location);
        actionCard = this.renderDetectiveActionCard(index, spyIndex, filteredVoteChoices, sessionCode);
      }
      await Resolvers.proactiveMessage.notifyIndividualCard(
        player.aad, identityCard);
      await Resolvers.proactiveMessage.notifyUpdatableIndividualCard(
        player.aad, actionCard, actionCardId(sessionCode));
    });

    return await stepContext.endDialog();
  }

  async restartStep(stepContext) {
    switch (stepContext.result.value) {
      case '🕹️Start Another Match': {
        return await stepContext.replaceDialog(
          constants.SPYFALL_DIALOG,
          stepContext.options
        );
      }

      case '📖End Game': {
        return await stepContext.endDialog();
      }
    }

    return await stepContext.endDialog();
  }

  renderSpyCard() {
    const spyfallCard = getIdentityCard(this._spyfallRoles);
    const card = CardFactory.adaptiveCard(spyfallCard);
    card.content.body[2].text = 'Your location: ❓';
    card.content.body[3].text = 'Your role: 😈Spy';
    return card;
  }

  renderSpyActionCard(sessionCode, spyIndex, location) {
    const spyActionCard = getSpyActionCard();
    const card = CardFactory.adaptiveCard(spyActionCard);
    card.content.actions[0].title = 'Guess your location';
    card.content.actions[0].data.sessionCode = sessionCode;
    card.content.actions[0].data.spyIdx = spyIndex;
    card.content.actions[0].data.location = location;
    return card;
  }

  renderDetectiveCard(index, spyIndex, location) {
    const detectiveCard = getIdentityCard(this._spyfallRoles);
    const card = CardFactory.adaptiveCard(detectiveCard);
    card.content.body[2].text =
      'Your location: ' +
      this._spyfallRoles[`location.${location}`];
    card.content.body[3].text =
      'Your role: ' +
      this._spyfallRoles[`location.${location}.role${((index + spyIndex) % 7) + 1}`];
    return card;
  }

  renderDetectiveActionCard(index, spyIndex, voteChoices, sessionCode) {
    const detectiveActionCard = getDetectiveActionCard();
    const card = CardFactory.adaptiveCard(detectiveActionCard);
    card.content.body[1].choices = voteChoices;
    card.content.actions[0].title = 'Vote the spy';
    card.content.actions[0].data.playerVote = index;
    card.content.actions[0].data.spyIdx = spyIndex;
    card.content.actions[0].data.sessionCode = sessionCode;
    return card;
  }
}

module.exports = {
  SpyfallDialog,
  SpyfallDialogVotedPlayerCache: votedPlayerSet
};

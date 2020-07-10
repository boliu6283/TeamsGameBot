// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog, WaterfallDialog, ChoicePrompt } = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder-core');
const { getRandomInt } = require('../../../helpers/thumbnail');
const { spyfallEndGamehelper } = require('../../../helpers/games/spyfall');
const constants = require('../../../config/constants');
const SpyfallCard = require('../../../static/spyfallCard.json');
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
        this.loadGameConfig.bind(this),
        this.startGameSession.bind(this),
        this.registerCountdown.bind(this),
        this.distributeRoleStep.bind(this),
        this.restartStep.bind(this)
      ])
    );

    this.initialDialogId = constants.SPYFALL_WATERFALL_DIALOG;
  }

  async loadGameConfig(stepContext) {
    let gameInfo = await Resolvers.game.getGameByName({ gameName: '🕵️Who Is Undercover' });
    this.SpyfallRoles = gameInfo.metadata;

    for (let i = 0; i < this.SpyfallRoles.locations.length; i++) {
      const locationItem = {
        type: 'TextBlock',
        text: this.SpyfallRoles[`location.${this.SpyfallRoles.locations[i]}`]
      };
      SpyfallCard.body[1].columns[i % 3].items.push(locationItem);
    }

    return stepContext.next();
  }

  async startGameSession(stepContext) {
    if (stepContext.context.activity.value) {
      stepContext.options.sessionCode = stepContext.context.activity.value.sessionCode;
    }

    votedPlayerSet.clear();
    const sessionCode = stepContext.options.sessionCode;
    const lifespan = constants.DEFAULT_SPYFALL_LIFESPAN_SEC;

    await Resolvers.proactiveMessage.notifySession(
      sessionCode,
      `**Spyfall ${sessionCode} is now started, try to find the spy in ${lifespan} seconds!**`
    );

    // TODO: lifespan should be adjustable based on the number of players
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
    const location = this.SpyfallRoles.locations[getRandomInt(this.SpyfallRoles.locations.length)];
    const displayLocation = this.SpyfallRoles[`location.${location}`];
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
      const playerCard = CardFactory.adaptiveCard(SpyfallCard);
      if (index == spyIndex) {
        this.renderSpyCard(playerCard, location);
      } else {
        this.renderRoleCard(playerCard, index, spyIndex, location, filteredVoteChoices, stepContext.options.sessionCode);
      }
      await Resolvers.proactiveMessage.notifyIndividualCard(
        player.aad,
        playerCard
      );
    });

    // return await stepContext.prompt(constants.SPYFALL_PROMPT, {
    //   prompt: 'wtf',
    //   choices: ['🕹️StartAnotherMatch', '📖EndGame']
    // });
    return await stepContext.endDialog();
  }

  async restartStep(stepContext) {
    switch (stepContext.result.value) {
      case '🕹️StartAnotherMatch': {
        return await stepContext.replaceDialog(
          constants.SPYFALL_DIALOG,
          stepContext.options
        );
      }

      case '📖EndGame': {
        return await stepContext.endDialog();
      }
    }

    return await stepContext.endDialog();
  }

  renderSpyCard(card, location) {
    card.content.body[2].text = 'Your location: ❓';
    card.content.body[3].text = 'Your role: 😈Spy';
    card.content.body[4].text = 'Note: you only have one chance to guess.'
    card.content.body[5] = {
      type: 'Input.Text',
      id: 'spyGuess'
    };
    card.content.actions[0].data.location = displayLocation;
    card.content.actions[0].title = 'Guess your location';
  }

  renderRoleCard(card, index, spyIndex, location, voteChoices, sessionCode) {
    card.content.body[2].text =
      'Your location: ' +
      displayLocation;

    card.content.body[3].text =
      'Your role: ' +
      this.SpyfallRoles[`location.${location}.role${((index + spyIndex) % 7) + 1}`];

    card.content.body[4].text = 'Note: you only have one chance to vote.'

    card.content.body[5] = {
      type: 'Input.ChoiceSet',
      id: 'selectedPersonAAD',
      style: 'expanded',
      choices: voteChoices
    };

    card.content.actions[0].data.playerVote = index;
    card.content.actions[0].data.spyIdx = spyIndex;
    card.content.actions[0].data.sessionCode = sessionCode;
    card.content.actions[0].title = 'Vote the spy';
  }
}

module.exports = {
  SpyfallDialog,
  SpyfallDialogVotedPlayerCache: votedPlayerSet
};

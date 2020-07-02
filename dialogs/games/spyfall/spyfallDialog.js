// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog, WaterfallDialog, ChoicePrompt } = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder-core');
const { getRandomInt } = require('../../../helpers/thumbnail');
const constants = require('../../../config/constants');
const SpyfallRoles = require('../../../static/spyfall.json');
const SpyfallCard = require('../../../static/spyfallCard.json');
const Resolvers = require('../../../resolvers');

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

    for (let i = 0; i < SpyfallRoles.locations.length; i++) {
      const locationItem = {
        type: 'TextBlock',
        text: SpyfallRoles.locations[i]
      };
      SpyfallCard.body[1].columns[i % 3].items.push(locationItem);
    }

    this.initialDialogId = constants.SPYFALL_WATERFALL_DIALOG;
  }

  async startGameSession(stepContext) {
    if (stepContext.context.activity.value) {
      stepContext.options.sessionCode = stepContext.context.activity.value.sessionCode;
    }
    const sessionCode = stepContext.options.sessionCode;
    const lifespan = constants.DEFAULT_SPYFALL_LIFESPAN_SEC;

    await Resolvers.proactiveMessage.notifySession(
      sessionCode,
      `Spyfall ${sessionCode} is now started, try to find the spy in ${lifespan} seconds`
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
        // TODO: handle win logic and prompt retry card
        await Resolvers.proactiveMessage.notifySession(
          sessionCode,
          `Spyfall ${sessionCode} is now finished, spy wins`
        );
      }
    );

    return await stepContext.next();
  }

  async distributeRoleStep(stepContext) {
    let session = await Resolvers.gameSession.getSession({ code: stepContext.options.sessionCode });
    const location = SpyfallRoles.locations[getRandomInt(SpyfallRoles.locations.length)];
    const spyIndex = getRandomInt(session.players.length + 1);
    let voteChoices = session.players.map(p => {
      return { title: p.name, value: p._id};
    });
    voteChoices.push({
      title: session.host.name,
      value: session.host._id
    });

    session.players.push(session.host);
    session.players.forEach(async (player, index) => {
      const filteredVoteChoices = voteChoices.filter(choice => choice.title !== player.name);
      const playerCard = CardFactory.adaptiveCard(SpyfallCard);
      if (index == spyIndex) {
        this.renderSpyCard(playerCard);
      } else {
        this.renderRoleCard(playerCard, index, spyIndex, location, filteredVoteChoices, player._id);
      }
      await Resolvers.proactiveMessage.notifyIndividualCard(
        player.aad,
        playerCard
      );
    });

    return await stepContext.prompt(constants.SPYFALL_PROMPT, {
      prompt: 'wtf',
      choices: ['🕹️StartAnotherMatch', '📖EndGame']
    });
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

  renderSpyCard(card) {
    card.content.body[2].text = 'Your location: ❓';
    card.content.body[3].text = 'Your role: 😈Spy';
    card.content.body[4].text = 'Note: you only have one chance to guess.'
    card.content.body[5] = {
      type: 'Input.Text',
      id: 'guess'
    };
    card.content.actions[0].title = 'Guess your location';
  }

  renderRoleCard(card, index, spyIndex, location, voteChoices, id) {
    card.content.body[2].text =
      'Your location: ' +
      SpyfallRoles[`location.${location}`];

    card.content.body[3].text =
      'Your role: ' +
      SpyfallRoles[`location.${location}.role${((index + spyIndex) % 7) + 1}`];

    card.content.body[4].text = 'Note: you only have one chance to vote.'

    card.content.body[5] = {
      type: 'Input.ChoiceSet',
      id,
      style: 'expanded',
      choices: voteChoices
    };

    card.content.actions[0].title = 'Vote the spy';
  }
}

module.exports = {
  SpyfallDialog,
};

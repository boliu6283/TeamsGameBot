// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder-core');
const { headsupEndgameHelper } = require('../../../helpers/games/headsup');
const { getHeadsupCard } = require('../../../helpers/games/headsupCard');
const constants = require('../../../config/constants');
const Resolvers = require('../../../resolvers');

class HeadsupDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.HEADSUP_DIALOG);
    this._luisRecognizer = luisRecognizer;

    this.addDialog(
      new WaterfallDialog(constants.HEADSUP_WATERFALL_DIALOG, [
        this.startGameSession.bind(this),
        this.registerCountdown.bind(this),
        this.distributeWordsStep.bind(this),
        this.restartStep.bind(this)
      ])
    );

    this.initialDialogId = constants.HEADSUP_WATERFALL_DIALOG;
    this._metadata = null;
  }

  async startGameSession(stepContext) {
    const sessionCode = stepContext.context.activity.value.sessionCode;
    stepContext.options.sessionCode = sessionCode;
    stepContext.options.session = await Resolvers.gameSession.getSession({ code: sessionCode });

    // Initialize game data
    if (!this._metadata) {
      this._metadata = await Resolvers.game.getHeadsupMetadata();
    }

    // Set lifespan of this session
    const session = stepContext.options.session;
    const playersCount = session.players.length + 1;
    const lifespan = constants.HEADSUP_TURN_PER_PERSON_SEC * playersCount;

    await Resolvers.proactiveMessage.notifySession(
      sessionCode,
      `**HeadsUp ${sessionCode} is now started, try to lure other players to say their forbidden words in ${lifespan} seconds!**`
    );

    await Resolvers.gameSession.startSession({
      code: sessionCode,
      lifespanSec: lifespan
    });

    return await stepContext.next();
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
        await headsupEndgameHelper({
          sessionCode,
          reason: 'timeout'
        });
      }
    );

    return await stepContext.next();
  }

  async distributeWordsStep(stepContext) {
    const session = stepContext.options.session;

    const allPlayers = [...session.players];
    allPlayers.push(session.host);

    const allAssignedWords = this._generateWordsForPlayers(allPlayers);
    allPlayers.forEach(async (player) => {
      const card = this._generateWordAssignmentCard(session.code, allAssignedWords, player);
      const adaptiveCard = CardFactory.adaptiveCard(card);
      await Resolvers.proactiveMessage.notifyIndividualCard(player.aad, adaptiveCard);
    });
    return await stepContext.endDialog();
  }

  async restartStep(stepContext) {
    switch (stepContext.result.value) {
      case '🕹️Start Another Match': {
        return await stepContext.replaceDialog(
          constants.HEADSUP_DIALOG,
          stepContext.options
        );
      }

      case '📖End Game': {
        return await stepContext.endDialog();
      }
    }

    return await stepContext.endDialog();
  }

  _generateWordsForPlayers(allPlayers) {
    const wordsSet = new Set();
    const presetWordsList = this._metadata.words;
    while (wordsSet.size < allPlayers.length) {
      let wordIndex = Math.floor(Math.random() * presetWordsList.length);
      wordsSet.add(presetWordsList[wordIndex]);
    }

    // { playeraad: { player: player, word: word } }
    const wordsArray = [...wordsSet];
    const assignedWords = {};
    allPlayers.forEach((player, index) => {
      assignedWords[player.aad] = {
        player: player,
        word: wordsArray[index],
      }
    })
    return assignedWords;
  }

  _generateWordAssignmentCard(sessionCode, allAssignedWords, currentPlayer) {
    const otherAssignedWords = Object.keys(allAssignedWords)
      .filter(aad => aad != currentPlayer.aad)
      .reduce((obj, key) => {
        obj[key] = allAssignedWords[key];
        return obj;
      }, {});
    return getHeadsupCard(sessionCode, currentPlayer, otherAssignedWords);
  }
}

module.exports = {
  HeadsupDialog
}

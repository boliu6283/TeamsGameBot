// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { Dialog } = require('botbuilder-dialogs');
const Resolvers = require('../../../resolvers');
const { actionCardId } = require('../../../helpers/updatableId');
const { spyfallEndGamehelper } = require('../../../helpers/games/spyfall')
const constants = require('../../../config/constants');

class SpyfallGuessDialog extends Dialog {
  constructor(luisRecognizer) {
    super(constants.SPYFALL_GUESS_DIALOG);

    this._luisRecognizer = luisRecognizer;
  }

  async beginDialog(dc, options) {
    const { spyIdx, spyGuess, location, sessionCode } = dc.context.activity.value;
    const res = spyGuess.toLowerCase().trim() === location.toLowerCase().trim() ?
                'guessCorrect' : 'guessWrong';

    // Clean up countdown and location card
    await Resolvers.countdown.kill(sessionCode);
    await Resolvers.proactiveMessage.deleteUpdatableSession(sessionCode, actionCardId(sessionCode));

    // Calculate endgame score
    await spyfallEndGamehelper({
      code: sessionCode,
      res,
      spyIdx
    });

    return await dc.endDialog();
  }
}

module.exports = {
  SpyfallGuessDialog
};

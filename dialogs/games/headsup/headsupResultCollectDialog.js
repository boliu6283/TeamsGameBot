// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog } = require('botbuilder-dialogs');
const { headsupEndgameHelper } = require('../../../helpers/games/headsup');
const constants = require('../../../config/constants');

class HeadsupResultCollectDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.HEADSUP_RESULT_COLLECT_DIALOG);
    this._luisRecognizer = luisRecognizer;

    this.initialDialogId = constants.HEADSUP_RESULT_COLLECT_DIALOG;
  }

  async beginDialog(dc, options) {
    const { headsupLoserAad, sessionCode } = dc.context.activity.value;
    await headsupEndgameHelper({
      sessionCode,
      reason: 'admitted',
      loserAad: headsupLoserAad
    });
  }
}

module.exports = {
  HeadsupResultCollectDialog
}

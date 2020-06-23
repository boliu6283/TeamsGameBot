const { Dialog } = require('botbuilder-dialogs');
const constants = require('../config/constants');

class GameChoiceDialog extends Dialog {
  constructor(luisRecognizer) {
    super(constants.GAME_CHOICE_DIALOG);

    // Dependency Injections from parent MainDialog
    this._luisRecognizer = luisRecognizer;
  }

  async beginDialog(dc, options) {
    const email = options.user.email;
    await dc.context.sendActivity(`GameChoiceDialog BEGIN ${email}`);
    return await dc.continueDialog();
  }
}

module.exports = {
  GameChoiceDialog
};

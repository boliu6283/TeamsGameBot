const { Dialog } = require("botbuilder-dialogs");
const constants = require("../constants");

class GameChoiceSubDialog extends Dialog {
  constructor(luisRecognizer) {
    super(constants.GAME_CHOICE_DIALOG);
    this._luisRecognizer = luisRecognizer;
  }

  async beginDialog(dc, options) {
    await dc.context.sendActivity(`Hi! I'm a bot.`);
    return await dc.endDialog();
  }
}

module.exports = {
  GameChoiceSubDialog
};

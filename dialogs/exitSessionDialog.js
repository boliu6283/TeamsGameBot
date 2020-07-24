const { Dialog } = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder-core');
const constants = require('../../../config/constants');
const { exitSessionPics } = require('../../../config/pics');
const ExitSessionCard = require('../../../static/exitSessionCard.json');

class ExitSessionDialog extends Dialog {
  constructor(luisRecognizer) {
    super(constants.EXIT_SESSION_DIALOG);

    this._luisRecognizer = luisRecognizer;
  }

  async beginDialog(dc, options) {
    let card = CardFactory.adaptiveCard(ExitSessionCard);
    card.content.body[0].url = exitSessionPics[0];
    
    await dc.context.sendActivity({ attachments: [card] });
    return await dc.endDialog();
  }
}

module.exports = {
  ExitSessionDialog
};

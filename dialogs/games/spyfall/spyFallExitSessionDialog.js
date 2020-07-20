const { Dialog } = require('botbuilder-dialogs');
const Resolvers = require('../../../resolvers');
const constants = require('../../../config/constants');
const { exitSessionPics } = require('../../../config/pics');
const SpyfallExitSessionCard = require('../../../static/spyfallExitSessionCard.json');
const { CardFactory } = require('botbuilder-core');

class SpyfallExitSessionDialog extends Dialog {
  constructor(luisRecognizer) {
    super(constants.SPYFALL_EXIT_SESSION_DIALOG);

    this._luisRecognizer = luisRecognizer;
  }

  async beginDialog(dc, options) {
    let card = CardFactory.adaptiveCard(SpyfallExitSessionCard);
    card.content.body[0].url = exitSessionPics[0];
    
    await dc.context.sendActivity({ attachments: [card] });
    return await dc.endDialog();
  }
}

module.exports = {
  SpyfallExitSessionDialog
};

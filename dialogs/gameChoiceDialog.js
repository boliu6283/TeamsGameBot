const { Dialog } = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder-core');
const Resolvers = require('../resolvers');
const constants = require('../config/constants');
const GameMenuCard = require('../static/gameMenuCard.json');

class GameChoiceDialog extends Dialog {
  constructor(luisRecognizer) {
    super(constants.GAME_CHOICE_DIALOG);

    // Dependency Injections from parent MainDialog
    this._luisRecognizer = luisRecognizer;
  }

  async beginDialog(dc, options) {
    const email = options.user.email;
    const allGames = await Resolvers.game.getAllGames();
    const gameMenuCard = CardFactory.adaptiveCard(GameMenuCard);

    // TODO: render game menu card here


    await dc.context.sendActivity({ attachments: [gameMenuCard] });
    return await dc.continueDialog();
  }
}

module.exports = {
  GameChoiceDialog
};

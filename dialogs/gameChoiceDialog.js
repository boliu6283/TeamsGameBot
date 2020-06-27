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
    // Clean up GameMenuCard
    GameMenuCard.body[0].items[0].columns[0].items = [];
    GameMenuCard.body[0].items[0].columns[1].items = [];

    const allGames = await Resolvers.game.getAllGames();
    const gameMenuCard = CardFactory.adaptiveCard(GameMenuCard);

    // TODO: render game menu card here
    allGames.forEach(game => {
      gameMenuCard.content.body[0].items[0].columns[0].items.push({
        type: 'Image',
        url: game.profile,
        size: 'auto'
      });
      gameMenuCard.content.body[0].items[0].columns[1].items.push({
        type: 'Action.Submit',
        title: 'Create Room',
        data: {
          action: 'create',
          gameMenuChoice: game._id
        }
      });
    });

    await dc.context.sendActivity({ attachments: [gameMenuCard] });
    return await dc.continueDialog();
  }
}

module.exports = {
  GameChoiceDialog
};

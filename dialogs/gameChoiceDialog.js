const { ComponentDialog, WaterfallDialog, ChoicePrompt, ListStyle } = require('botbuilder-dialogs');
const { CardFactory, MessageFactory } = require('botbuilder-core');
const Resolvers = require('../resolvers');
const constants = require('../config/constants');
const GameCard = require('../static/gameCard.json');

class GameChoiceDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.GAME_CHOICE_DIALOG);

    this._luisRecognizer = luisRecognizer;

    this.addDialog(new ChoicePrompt(constants.GAME_CARD_PROMPT));
    this.addDialog(new WaterfallDialog(constants.GAME_WATERFALL_DIALOG, [
        this.gameStep.bind(this)
    ]));

    this.initialDialogId = constants.GAME_WATERFALL_DIALOG;
  }

  async gameStep(stepContext) {
    // Clean up GameCard
    GameCard.body = [];
    
    const gameCard = CardFactory.adaptiveCard(GameCard);
    const allGames = await Resolvers.game.getAllGames();
    const allGameChoices = allGames.map(game => game.name);

    allGames.forEach(game => {
      const gameTitle = {
        type: 'TextBlock',
        spacing: 'medium',
        size: 'large',
        weight: 'bolder',
        text: game.name,
        wrap: true,
        maxLines: 0
      };

      const gameDescription = {
        type: 'TextBlock',
        spacing: 'medium',
        size: 'small',
        weight: 'default',
        text: game.description,
        wrap: true
      };

      const gameImage = {
        type: 'Image',
        url: game.profile,
        size: 'auto'
      };

      gameCard.content.body.push({
        type: 'Container',
        items: [
          {
            type: 'ColumnSet',
            columns: [
              {
                type: 'Column',
                width: 'stretch',
                items: [gameTitle, gameDescription]
              },
              {
                type: 'Column',
                width: 'stretch',
                items: [gameImage]
              }
            ]
          }
        ]
      });
    });

    return await stepContext.prompt(constants.GAME_CARD_PROMPT, {
      prompt: MessageFactory.attachment(gameCard),
      retryPrompt: 'Please select a game.',
      choices: allGameChoices
    });
  }
}

module.exports = {
  GameChoiceDialog
};

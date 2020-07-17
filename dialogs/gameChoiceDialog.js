const { Dialog, ComponentDialog, WaterfallDialog, ChoicePrompt } = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder-core');
const { CreateSessionDialog } = require('./createSessionDialog');
const Resolvers = require('../resolvers');
const constants = require('../config/constants');
const GameCard = require('../static/gameCard.json');

class GameChoiceDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.GAME_CHOICE_DIALOG);

    this._luisRecognizer = luisRecognizer;

    this.addDialog(new WaterfallDialog(constants.GAME_WATERFALL_DIALOG, [
        this.gameCardStep.bind(this),
        this.gameChoiceStep.bind(this)
    ]));
    this.addDialog(new CreateSessionDialog(constants.CREATE_SESSION_DIALOG));

    this.initialDialogId = constants.GAME_WATERFALL_DIALOG;
  }

  async gameCardStep(stepContext) {
    // Clean up GameCard
    GameCard.body = [];
    GameCard.actions = [];
    
    let gameCard = CardFactory.adaptiveCard(JSON.parse(JSON.stringify(GameCard)));
    const allGames = await Resolvers.game.getAllGames();

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

      const gameBtn = {
        type: 'Action.Submit',
        title: game.name,
        data: {
          gameChoice: game._id
        }
      };

      gameCard.content.actions.push(gameBtn);
    });

    await stepContext.context.deleteActivity(stepContext.options.lastActivityId);
    stepContext.options.lastActivityId = (await stepContext.context.sendActivity({ attachments: [gameCard] })).id;

    return Dialog.EndOfTurn;
  }

  async gameChoiceStep(stepContext) {
    const choice = stepContext.context._activity.value;
    if (!choice) {
      return await stepContext.replaceDialog(constants.GAME_CHOICE_DIALOG, stepContext.options);
    }
    stepContext.options.gameChoice = choice.gameChoice;
    return await stepContext.replaceDialog(constants.CREATE_SESSION_DIALOG, stepContext.options);
  }
}

module.exports = {
  GameChoiceDialog
};

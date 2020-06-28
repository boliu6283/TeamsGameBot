const { ComponentDialog, WaterfallDialog, ChoicePrompt, ListStyle } = require('botbuilder-dialogs');
const { CardFactory, MessageFactory } = require('botbuilder-core');
const Resolvers = require('../resolvers');
const constants = require('../config/constants');
const CreateSessionCard = require('../static/createSessionCard.json');

class CreateSessionDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.CREATE_SESSION_DIALOG);

    this._luisRecognizer = luisRecognizer;

    this.addDialog(new WaterfallDialog(constants.CREATE_SESSION_WATERFALL_DIALOG, [
        this.createSessionCardStep.bind(this)
    ]));

    this.initialDialogId = constants.CREATE_SESSION_WATERFALL_DIALOG;
  }

  async createSessionCardStep(stepContext) {
    // Find the chosen game.
    //
    const chosenGame = stepContext.options.gameChoice;
    const gameInfo = await Resolvers.game.getGameByName({ gameName: chosenGame });

    // Get host info.
    //
    const userInfo = stepContext.options.user;

    // Generate code
    //
    const roomCode = generateCode();

    // Render session creation card. 
    // TODO: add title for room code.
    let createSessionCard = CardFactory.adaptiveCard(CreateSessionCard);
    createSessionCard.content.body[0].items[0].columns[0].items[0].text = gameInfo.name;
    createSessionCard.content.body[0].items[0].columns[0].items[1].url = gameInfo.profile;
    createSessionCard.content.body[0].items[0].columns[0].items[2].text = roomCode.toString();

    await stepContext.context.sendActivity({ attachments: [createSessionCard] });
    await stepContext.context.sendActivity('Creating session...');
    
    Resolvers.gameSession.createSession()
  }
}

function generateCode() {
  return 'xxxx'.replace(/[x]/g, function(c) {
     var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
     return v.toString(16);
  });
}

module.exports = {
  CreateSessionDialog
};

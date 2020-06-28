const { ComponentDialog, WaterfallDialog, ChoicePrompt, ListStyle } = require('botbuilder-dialogs');
const { CardFactory, MessageFactory } = require('botbuilder-core');
const Resolvers = require('../resolvers');
const constants = require('../config/constants');
const CreateSessionCard = require('../static/createSessionCard.json');

class CreateSessionDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.CREATE_SESSION_DIALOG);

    this._luisRecognizer = luisRecognizer;

    this.addDialog(new ChoicePrompt(constants.CREATE_SESSION_CARD_PROMPT));
    this.addDialog(new WaterfallDialog(constants.CREATE_SESSION_WATERFALL_DIALOG, [
        this.createSessionCardStep.bind(this)
    ]));

    this.initialDialogId = constants.CREATE_SESSION_WATERFALL_DIALOG;
  }

  async createSessionCardStep(stepContext) {
    // Clean up CreateSessionCard
    // CreateSessionCard.body = [];

    let createSessionCard = CardFactory.adaptiveCard(CreateSessionCard);

    return await stepContext.prompt(constants.CREATE_SESSION_CARD_PROMPT, {
      prompt: MessageFactory.attachment(createSessionCard),
      choices: ['Create Room']
    });
  }
}

module.exports = {
  CreateSessionDialog
};

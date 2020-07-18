const { Dialog, ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder-core');
const constants = require('../config/constants');
const { joinSessionHelper } = require('../helpers/joinSession');
const JoinSessionCard = require('../static/joinSessionCard.json');


class JoinSessionDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.JOIN_SESSION_DIALOG);

    this._luisRecognizer = luisRecognizer;

    this.addDialog(new WaterfallDialog(constants.JOIN_SESSION_WATERFALL_DIALOG, [
      this.joinSessionCardSetup.bind(this),
      this.searchSession.bind(this)
    ]));

    this.initialDialogId = constants.JOIN_SESSION_WATERFALL_DIALOG;
  }

  async joinSessionCardSetup(stepContext) {
    // first send user a card asking for room code
    const joinSessionCard = CardFactory.adaptiveCard(JSON.parse(JSON.stringify(JoinSessionCard)));
    await stepContext.context.deleteActivity(stepContext.options.lastActivityId);
    stepContext.options.lastActivityId = (await stepContext.context.sendActivity({ attachments: [joinSessionCard] })).id;


    // Adaptive Card nativly don't work with prompt, it won't wait for user action
    // to send back, as a workaround, we will first send the card and end the current dialog
    // let waterfall flow execute and handle adaptive user input in the next dialog in waterfall
    // ref: https://stackoverflow.com/questions/54156007/handling-adaptive-cards-in-microsoft-bot-framework-v4-nodejs/54188107#54188107
    return Dialog.EndOfTurn;
  }

  async searchSession(stepContext) {
    const choice = stepContext.context._activity.value;
    if (!choice) {
      return await this.fallBackToUserInput(
        'Action unsupported, please enter a valid room number, or click Return to exit.',
        stepContext)
    }

    switch (choice.joinSessionChoice) {
      case 'join': {
        await joinSessionHelper(stepContext, choice.sessionCode);
        break;
      }

      case 'back': {
        return await stepContext.replaceDialog(constants.WELCOME_DIALOG, stepContext.options);
      }
    }

    return await stepContext.endDialog();
  }
}

module.exports = {
  JoinSessionDialog
};

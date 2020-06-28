const {
  Dialog,
  ComponentDialog,
  WaterfallDialog,
  ChoicePrompt,
  TextPrompt } = require('botbuilder-dialogs');
const { CardFactory, MessageFactory } = require('botbuilder-core');
const Resolvers = require('../resolvers');
const constants = require('../config/constants');
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
    // first send user a card asking for room number
    const userInputCard = CardFactory.adaptiveCard(JoinSessionCard);
    await stepContext.context.sendActivity({ attachments: [userInputCard] });

    // Adaptive Card nativly don't work with prompt, it won't wait for user action
    // to send back, as a workaround, we will first send the card and end the current dialog
    // let waterfall flow execute and handle adaptive user input in the next dialog in waterfall
    // ref: https://stackoverflow.com/questions/54156007/handling-adaptive-cards-in-microsoft-bot-framework-v4-nodejs/54188107#54188107 
    return Dialog.EndOfTurn;
  }

  async searchSession(stepContext) {
    const activity = stepContext.context.activity;

    // make sure the response is from postback(adaptive submit button)
    // otherwise fall back to initial user input card
    if (!activity.channelData.postBack) {
      return await this.fallBackToUserInput('action unsupported, please enter a valid room number', stepContext)
    }
    const roomNumber = activity.value.id_room_number;

    // valid user input roomNumber, fallback to user input if failed
    if (!roomNumber || roomNumber < 0) {
      console.log('invalid room number:' + roomNumber);
      return this.fallBackToUserInput('error, please enter a valid room number', stepContext);
    }

    const session = await Resolvers.gameSession.getSession({ code: roomNumber });
    await stepContext.context.sendActivity("Opening Room ......");

    // TODO chi:
    // check session status, if session is await then include myself and update session
    // otherwise just pop error says session already over

    // TODO chi:
    // send p2p message to host-> payload: my name?

    return await stepContext.endDialog();
  }

  async fallBackToUserInput(errorMessage, stepContext) {
    await stepContext.context.sendActivity(errorMessage);
    return await stepContext.replaceDialog(constants.JOIN_SESSION_WATERFALL_DIALOG, stepContext.options);
  }
}

module.exports = {
  JoinSessionDialog
};

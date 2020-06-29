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
const { getSession } = require('../resolvers/gameSession');

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
    if (!(activity.value || {}).session_code) {
      return await this.fallBackToUserInput('action unsupported, please enter a valid room number', stepContext)
    }
    const sessionCode = activity.value.session_code;

    // valid user input sessionCode, fallback to user input if failed
    if (!sessionCode || sessionCode < 0) {
      console.log('invalid room number:' + sessionCode);
      return this.fallBackToUserInput('error, please enter a valid room number', stepContext);
    }

    // add current user into the session.players
    await Resolvers.gameSession.addPlayerToSession({
      code: sessionCode,
      userId: stepContext.options.user._id
    });
    await stepContext.context.sendActivity("Opening Room ......");

    // notify host that someone join the meeting, generate a link to start game
    const session = await Resolvers.gameSession.getSession({ code: sessionCode });
    const emailList = session.players.map(p => p.email).join(',');
    await Resolvers.proactiveMessage.notifyIndividual(
      session.host.aad,
      `${stepContext.options.user.name} has now joined room ${sessionCode}.
       Do you want to start the game?
       https://teams.microsoft.com/l/chat/0/0?users=${emailList}&topicName=GameBotSession${sessionCode}`
    );

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

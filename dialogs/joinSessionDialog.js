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
      return await this.fallBackToUserInput(
        'action unsupported, please enter a valid session code',
        stepContext)
    }

    // validate user input sessionCode, fallback to user input if failed
    const sessionCode = activity.value.session_code;
    const session = await Resolvers.gameSession.getSession({ code: sessionCode });
    if (!session) {
      console.log('invalid session code:' + sessionCode);
      return await this.fallBackToUserInput(
        'Session cannot be found, please retry again',
        stepContext);
    }

    // block user if join as a host
    /*
    if (session.host.aad === stepContext.options.user.aad) {
      return await this.fallBackToUserInput(
        'You cannot join your own room as a host, please share the room code with others',
        stepContext);
    }
    */

    // block user if the session is started or completed
    if (session.status === 'start') {
      return await this.fallBackToUserInput(
        'This session has already been started',
        stepContext);
    }

    if (session.status === 'complete') {
      return await this.fallBackToUserInput(
        'This session is completed, please consider join a new room',
        stepContext);
    }

    // add current user into the session.players
    await this.addPlayerToAwaitingSession(session, stepContext);

    // notify host that someone join the meeting, generate a link to start game
    await this.notifyHostToStartSession(session, stepContext);

    return await stepContext.endDialog();
  }

  async addPlayerToAwaitingSession(session, stepContext) {
    await Resolvers.gameSession.addPlayerToSession({
      code: session.code,
      userId: stepContext.options.user._id
    });
    await stepContext.context.sendActivity(`Successfully joined session ${session.code}`);
  }

  async notifyHostToStartSession(session, stepContext) {
    await Resolvers.proactiveMessage.notifyIndividual(
      session.host.aad,
      this.generateHostNotificationCard(session, stepContext)
    );
  }

  async fallBackToUserInput(errorMessage, stepContext) {
    await stepContext.context.sendActivity(errorMessage);
    return await stepContext.replaceDialog(constants.JOIN_SESSION_WATERFALL_DIALOG, stepContext.options);
  }

  generateHostNotificationCard(session, stepContext) {
    const emailList = session.players.map(p => p.email).join(',');
    const playerList = session.players.map(p => `<li>${p.name}</li>`).join('');
    const newPlayer = stepContext.options.user.name;
    return `<b>${newPlayer}</b> has now joined the room <b>${session.code}</b> hosted by you.
    <ul>${playerList}</ul>
    <a href='https://teams.microsoft.com/l/chat/0/0?users=${emailList}&topicName=GameBotSession${session.code}'>
     Start Game
    </a>`;
  }
}

module.exports = {
  JoinSessionDialog
};

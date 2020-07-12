const { Dialog, ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder-core');
const Resolvers = require('../resolvers');
const constants = require('../config/constants');
const JoinSessionCard = require('../static/joinSessionCard.json');
const NewPlayerJoinCard = require('../static/newPlayerJoinCard.json');

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
    const joinSessionCard = CardFactory.adaptiveCard(JoinSessionCard);
    await stepContext.context.sendActivity({ attachments: [joinSessionCard] });

    // Adaptive Card nativly don't work with prompt, it won't wait for user action
    // to send back, as a workaround, we will first send the card and end the current dialog
    // let waterfall flow execute and handle adaptive user input in the next dialog in waterfall
    // ref: https://stackoverflow.com/questions/54156007/handling-adaptive-cards-in-microsoft-bot-framework-v4-nodejs/54188107#54188107
    return Dialog.EndOfTurn;
  }

  async searchSession(stepContext) {
    const activity = stepContext.context.activity;

    // user click return button, go back to the welcome card.
    if ((activity.value || {}).return == "true") {
      return await stepContext.replaceDialog(constants.WELCOME_DIALOG, stepContext.options);
    }

    // make sure the response is from postback(adaptive submit button)
    // otherwise fall back to initial user input card
    if (!(activity.value || {}).sessionCode) {
      return await this.fallBackToUserInput(
        'Action unsupported, please enter a valid room number, or click Return to exit.',
        stepContext)
    }

    // validate user input sessionCode, fallback to user input if failed
    const sessionCode = activity.value.sessionCode;
    let session = await Resolvers.gameSession.getSession({ code: sessionCode });
    if (!session) {
      console.log('invalid session code:' + sessionCode);
      return await this.fallBackToUserInput(
        'Room cannot be found, please try again.',
        stepContext);
    }

    // block user if join as a host
    if (session.host.aad === stepContext.options.user.aad) {
      return await this.fallBackToUserInput(
        'You cannot join your own room as a host, please share the room code with others.',
        stepContext);
    }

    // block user if the session is started or completed
    if (session.status === 'start') {
      return await this.fallBackToUserInput(
        'This game session has already started.',
        stepContext);
    }

    if (session.status === 'complete') {
      return await this.fallBackToUserInput(
        'This game session is completed, please consider joining a new room.',
        stepContext);
    }

    // add current user into the session.players
    await this.addPlayerToAwaitingSession(session, stepContext);

    // get updated session
    session = await Resolvers.gameSession.getSession({ code: sessionCode });

    // notify host that someone join the meeting, generate a link to start game
    await this.notifyHostToStartSession(session, stepContext);

    return await stepContext.endDialog();
  }

  async addPlayerToAwaitingSession(session, stepContext) {
    await Resolvers.gameSession.addPlayerToSession({
      code: session.code,
      userId: stepContext.options.user._id
    });
    await stepContext.context.sendActivity(
      `Successfully joined ${session.game.name} session ${session.code}, ` +
      'please wait for host to start the game.');
  }

  async notifyHostToStartSession(session, stepContext) {
    await Resolvers.proactiveMessage.notifyIndividualCard(
      session.host.aad,
      this.generateHostNotificationCard(session, stepContext)
    );
  }

  async fallBackToUserInput(errorMessage, stepContext) {
    await stepContext.context.sendActivity(errorMessage);

    return await stepContext.replaceDialog(constants.JOIN_SESSION_WATERFALL_DIALOG, stepContext.options);
  }

  generateHostNotificationCard(session, stepContext) {
    const newPlayerJoinCard = CardFactory.adaptiveCard(NewPlayerJoinCard);
    newPlayerJoinCard.content.body[0].text = `New Member Joined: ${stepContext.options.user.name}`;
    const playersStr = '- ' + session.players.map(p => p.name).join('\r- ');
    newPlayerJoinCard.content.body[2].text = playersStr;
    newPlayerJoinCard.content.actions[0].data.sessionCode = session.code;
    newPlayerJoinCard.content.actions[0].data.callbackAction = this._getCallbackActionFromGame(session);
    return newPlayerJoinCard;
  }

  _getCallbackActionFromGame(session) {
    switch (session.game._id.toString()) {
      case '5ef2cda211846b2ac0225533': return constants.SPYFALL_START_CALLBACK;
      case '5ef2ce5810018e475c941ce1': return constants.HEADSUP_START_CALLBACK;
      default: throw new Error(`Game Id ${session.game._id} is not registerd in joinSessionDialog`);
    }
  }
}

module.exports = {
  JoinSessionDialog
};

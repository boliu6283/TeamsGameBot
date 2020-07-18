// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TeamsInfo } = require('botbuilder');
const { ComponentDialog, DialogSet, DialogTurnStatus} = require('botbuilder-dialogs');
const { LuisRecognizer } = require('botbuilder-ai');
const { WelcomeDialog } = require('./welcomeDialog');
const { SpyfallDialog } = require('./games/spyfall/spyfallDialog');
const { SpyfallGuessDialog } = require('./games/spyfall/spyfallGuessDialog');
const { SpyfallRaisePollDialog } = require('./games/spyfall/spyfallRaisePollDialog');
const { SpyfallPollResultCollectDialog } = require('./games/spyfall/spyfallPollResultCollectDialog');
const { HeadsupDialog } = require('./games/headsup/headsupDialog');
const { HeadsupResultCollectDialog } = require('./games/headsup/headsupResultCollectDialog');
const { generateUniqueSessionCode } = require('./createSessionDialog');
const constants = require('../config/constants')
const Resolvers = require('../resolvers');

class MainDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.MAIN_DIALOG);

    // Dependency Injections
    this._luisRecognizer = luisRecognizer;

    // Register Next Dialog
    this._dialogs = [
      new WelcomeDialog(luisRecognizer),
      new SpyfallDialog(luisRecognizer),
      new SpyfallGuessDialog(luisRecognizer),
      new SpyfallRaisePollDialog(luisRecognizer),
      new SpyfallPollResultCollectDialog(luisRecognizer),
      new HeadsupDialog(luisRecognizer),
      new HeadsupResultCollectDialog(luisRecognizer)
    ];

    // Define the default dialog for a new user to land on
    this.initialDialogId = constants.MAIN_DIALOG;
  }

  /**
   * Called from dialogbot.js
   * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
   * If no dialog is active, it will start the default dialog.
   * @param {*} turnContext from dialogBot.js
   * @param {*} dialogStateAccessor from dialogBot.js to record temporary conversation data
   * @param {*} userProfileStateAccessor from dialogBot.js to record user login information
   */
  async run(turnContext, dialogStateAccessor, userProfileStateAccessor) {
    // Register all dialogs in current folder
    const dialogSet = new DialogSet(dialogStateAccessor);
    dialogSet.add(this);
    this._dialogs.forEach(d => dialogSet.add(d));

    const dialogContext = await dialogSet.createContext(turnContext);

    // Fetch user information, if not exist, try login or register user
    const userProfile = await userProfileStateAccessor.get(turnContext, {});
    if (!userProfile.userModel) {
      userProfile.userModel = await this._loginOrRegisterUser(turnContext);
    }

    // Initiate Dialog conversation, starts main dialog
    const results = await dialogContext.continueDialog();
    if (results.status === DialogTurnStatus.empty ||
        results.status === DialogTurnStatus.complete) {
      // Pass userProfile into options field for beginDialog();
      await dialogContext.beginDialog(this.id, {
        user: userProfile.userModel
      });
    }
  }

  /**
   * This handler will be called when the current instance is push onto dialog
   * stack and start executed.
   * @param {*} dc DialogContext passed from parent dialog
   * @param {*} options userProfile
   */
  async beginDialog(dc, options) {
    if (dc.context.activity.text) {
      await this.textInputHandler(dc);
    }

    // Handler for proactive messages
    const input = dc.context.activity.value;
    if (input) {
      if (input.callbackAction === constants.SPYFALL_START_CALLBACK) {
        return await dc.beginDialog(constants.SPYFALL_DIALOG, options);
      } else if (input.spyGuess) {
        return await dc.beginDialog(constants.SPYFALL_GUESS_DIALOG, options);
      } else if (input.selectedPersonAAD) {
        return await dc.beginDialog(constants.SPYFALL_RAISE_POLL_DIALOG, options);
      } else if (input.spyfallPollSelectedResult) {
        return await dc.beginDialog(constants.SPYFALL_POLL_RESULT_COLLECT_DIALOG, options);
      } else if (input.recreateSession === 'spyfall') {
        await this.copySession(dc);
        return await dc.beginDialog(constants.SPYFALL_DIALOG, options);
      } else if (input.recreateSession === 'headsup') {
        await this.copySession(dc);
        return await dc.beginDialog(constants.HEADSUP_DIALOG, options);
      } else if (input.callbackAction === constants.HEADSUP_START_CALLBACK) {
        return await dc.beginDialog(constants.HEADSUP_DIALOG, options);
      } else if (input.headsupLoserAad) {
        return await dc.beginDialog(constants.HEADSUP_RESULT_COLLECT_DIALOG, options);
      } else if (input.exitGame) {
        return;
      }
    }

    return await dc.beginDialog(constants.WELCOME_DIALOG, options);
  }

  async textInputHandler(dc) {
    const luisResult = await this._luisRecognizer.recognize(dc.context);
    switch (LuisRecognizer.topIntent(luisResult)) {
      case 'Host': {
        return await dc.beginDialog(constants.GAME_CHOICE_DIALOG, options);
      }

      case 'Join': {
        return await dc.beginDialog(constants.JOIN_SESSION_DIALOG, options);
      }
    }
  }

  async copySession(dc) {
    let session = await Resolvers.gameSession.getSession({ code: dc.context.activity.value.sessionCode });
    let gameId = session.game._id;
    let hostInfo = session.host;
    let roomCode = await generateUniqueSessionCode();

    // create new game & session
    const gameInfo = await Resolvers.game.getGameById({ _id: gameId });
    let newSessionCode = await Resolvers.gameSession.createSession({ code: roomCode, game: gameInfo._id, host: hostInfo._id});

    // copy players
    await Promise.all(session.players.map(async (player) => {
      await Resolvers.gameSession.addPlayerToSession({
        code: newSessionCode,
        userId: player._id
      });
    }));

    // replace with new session
    dc.context.activity.value.sessionCode = newSessionCode;
  }

  async _loginOrRegisterUser(turnContext) {
    // Mock a user for emulator debug
    if (process.env.DebugMode === 'emulator') {
      const mockUser = {
        aad: turnContext.activity.from.id,
        email: `${turnContext.activity.from.id}@microsoft.com`,
        name: turnContext.activity.from.name,
        givenName: turnContext.activity.from.name,
      };
      let mockUserDbInfo = await Resolvers.user.getUser({ aad: mockUser.aad });
      if (!mockUserDbInfo) {
        mockUserDbInfo = await Resolvers.user.signupUser(mockUser);
      }

      return mockUserDbInfo;
    }

    let userDbInfo = await Resolvers.user.getUser({ aad: turnContext.activity.from.aadObjectId });
    if (!userDbInfo) {
      const userInfo = (await TeamsInfo.getMembers(turnContext))[0];
      userDbInfo = await Resolvers.user.signupUser({
        aad: userInfo.aadObjectId,
        email: userInfo.userPrincipalName,
        name: userInfo.name,
        givenName: userInfo.givenName
      });
    }

    return userDbInfo;
  }
}

module.exports.MainDialog = MainDialog;

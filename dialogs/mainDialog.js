// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TeamsInfo } = require('botbuilder');
const { ComponentDialog, DialogSet, DialogTurnStatus} = require('botbuilder-dialogs');
const { WelcomeDialog } = require('./welcomeDialog');
const { SpyfallDialog } = require('./spyfallDialog');
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
    // Handler for proactive messages
    if (dc.context.activity.value && dc.context.activity.value.msteams) {
      // start a new spyfall game from newPlayerJoinCard.json
      const startGameArgs = dc.context.activity.value.msteams;
      if (startGameArgs.displayText === constants.SPYFALL_START_CALLBACK) {
        const sessionCode = startGameArgs.text;
        return await dc.beginDialog(constants.SPYFALL_DIALOG, options);
      }
    }
    return await dc.beginDialog(constants.WELCOME_DIALOG, options);
  }

  async _loginOrRegisterUser(turnContext) {
    // Mock a user for emulator debug
    if (process.env.DebugMode === 'emulator') {
      const mockUser = {
        aad: turnContext.activity.from.id,
        email: turnContext.activity.from.id+'test@microsoft.com',
        name: turnContext.activity.from.id,
        givenName: turnContext.activity.from.id,
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

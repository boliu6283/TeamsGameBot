// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TeamsInfo } = require("botbuilder");
const { ComponentDialog, DialogSet, DialogTurnStatus} = require("botbuilder-dialogs");
const { WelcomeDialog } = require('./welcomeDialog');
const { GameChoiceDialog } = require('./gameChoiceDialog');
const constants = require('../constants')
const Resolvers = require('../resolvers');

class MainDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.MAIN_DIALOG);

    // Dependency Injections
    this._luisRecognizer = luisRecognizer;

    // Register Next Dialog
    this._dialogs = [
      new WelcomeDialog(luisRecognizer),
      new GameChoiceDialog(luisRecognizer)
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
    if (results.status === DialogTurnStatus.empty) {
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
    await dc.beginDialog(constants.WELCOME_DIALOG, options);
    return dc.endDialog();
  }

  async _loginOrRegisterUser(turnContext) {
    const userInfo = (await TeamsInfo.getMembers(turnContext))[0];
    let userDbInfo = await Resolvers.user.getUser({ aad: userInfo.aadObjectId });
    if (!userDbInfo) {
      userDbInfo = await Resolvers.user.signupUser({
        aad: userInfo.aadObjectId,
        email: userInfo.userPrincipalName,
        name: userInfo.name
      });
    }
    return userDbInfo;
  }
}

module.exports.MainDialog = MainDialog;

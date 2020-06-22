// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const {
  TimexProperty,
} = require("@microsoft/recognizers-text-data-types-timex-expression");
const { InputHints, TeamsInfo } = require("botbuilder");
const {
  ComponentDialog,
  DialogSet,
  DialogTurnStatus,
  TextPrompt,
  WaterfallDialog,
} = require("botbuilder-dialogs");
const { CardFactory } = require('botbuilder-core');
const { MAIN_WATERFALL_DIALOG } = require('../constants')
const { getRandomPic, menuPics } = require('../helpers/thumbnail');
const Resolvers = require('../resolvers');
const MainMenuCard = require('../static/mainMenuCard.json');

class MainDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super("MainDialog");

    this.luisRecognizer = luisRecognizer;

    // Define the main dialog flow and its components.
    this.addDialog(new TextPrompt("TextPrompt"))
        .addDialog(
          new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
            this.mainMenuStep.bind(this),
            this.actStep.bind(this),
            this.finalStep.bind(this),
          ])
        );

    // Define the default dialog for a new user to land on
    this.initialDialogId = MAIN_WATERFALL_DIALOG;
  }

  /**
   * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
   * If no dialog is active, it will start the default dialog.
   * @param {*} turnContext
   * @param {*} accessor
   */
  async run(turnContext, accessor) {
    this._user = await this.loginOrRegisterUser(turnContext);

    const dialogSet = new DialogSet(accessor);
    dialogSet.add(this);

    const dialogContext = await dialogSet.createContext(turnContext);
    const results = await dialogContext.continueDialog();
    if (results.status === DialogTurnStatus.empty) {
      await dialogContext.beginDialog(this.id);
    }
  }

  async mainMenuStep(stepContext) {
    const input = stepContext.context._activity.value;
    if (input) {
      switch(input.mainMenuChoice) {
        case 'game': {
          break;
        }

        case 'rank': {
          break;
        }

        case 'settings': {
          break;
        }
      }
      return await stepContext.next();
    }

    const mainMenuCard = CardFactory.adaptiveCard(MainMenuCard);
    mainMenuCard.content.body[1].url = getRandomPic(menuPics);
    return await stepContext.context.sendActivity({ attachments: [mainMenuCard] });
  }

  async actStep(stepContext) {
    const bookingDetails = {};

    // Call LUIS and gather any potential booking details. (Note the TurnContext has the response to the prompt)
    const luisResult = await this.luisRecognizer.executeLuisQuery(
      stepContext.context
    );
    switch (LuisRecognizer.topIntent(luisResult)) {
      case "MainMenu": {
        const mainMenuCard = CardFactory.adaptiveCard(MainMenuCard);
        await stepContext.context.sendActivity({ attachments: [mainMenuCard] });
      }

      default: {
        // Catch all for unhandled intents
        const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way (intent was ${LuisRecognizer.topIntent(
          luisResult
        )})`;
        await stepContext.context.sendActivity(
          didntUnderstandMessageText,
          didntUnderstandMessageText,
          InputHints.IgnoringInput
        );
      }
    }

    return await stepContext.context.sendActivity(
      'test',
      'test',
      InputHints.IgnoringInput
    );;
    // return await stepContext.next();
  }

  /**
   * This is the final step in the main waterfall dialog.
   * It wraps up the sample "book a flight" interaction with a simple confirmation.
   */
  async finalStep(stepContext) {
    // If the child dialog ("bookingDialog") was cancelled or the user failed to confirm, the Result here will be null.
    if (stepContext.result) {
      const result = stepContext.result;
      // Now we have all the booking details.

      // This is where calls to the booking AOU service or database would go.

      // If the call to the booking service was successful tell the user.
      const timeProperty = new TimexProperty(result.travelDate);
      const travelDateMsg = timeProperty.toNaturalLanguage(
        new Date(Date.now())
      );
      const msg = `I have you booked to ${result.destination} from ${result.origin} on ${travelDateMsg}.`;
      await stepContext.context.sendActivity(
        msg,
        msg,
        InputHints.IgnoringInput
      );
    }

    // Restart the main dialog with a different message the second time around
    return await stepContext.replaceDialog(this.initialDialogId, {
      restartMsg: "What else can I do for you?",
    });
  }

  async loginOrRegisterUser(turnContext) {
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

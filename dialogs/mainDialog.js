// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const {
  TimexProperty,
} = require("@microsoft/recognizers-text-data-types-timex-expression");
const { MessageFactory, InputHints } = require("botbuilder");
const { LuisRecognizer } = require("botbuilder-ai");
const {
  ComponentDialog,
  DialogSet,
  DialogTurnStatus,
  TextPrompt,
  WaterfallDialog,
} = require("botbuilder-dialogs");
const { CardFactory } = require('botbuilder-core');

const MainMenuCard = require('../resources/mainMenuCard.json');

const MAIN_WATERFALL_DIALOG = "mainWaterfallDialog";

class MainDialog extends ComponentDialog {
  constructor(luisRecognizer, bookingDialog) {
    super("MainDialog");

    if (!luisRecognizer)
      throw new Error(
        "[MainDialog]: Missing parameter 'luisRecognizer' is required"
      );
    this.luisRecognizer = luisRecognizer;

    if (!bookingDialog)
      throw new Error(
        "[MainDialog]: Missing parameter 'bookingDialog' is required"
      );

    // Define the main dialog and its related components.
    // This is a sample "book a flight" dialog.
    this.addDialog(new TextPrompt("TextPrompt"))
      .addDialog(bookingDialog)
      .addDialog(
        new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
          this.mainMenuStep.bind(this),
          this.actStep.bind(this),
          this.finalStep.bind(this),
        ])
      );

    this.initialDialogId = MAIN_WATERFALL_DIALOG;
  }

  /**
   * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
   * If no dialog is active, it will start the default dialog.
   * @param {*} turnContext
   * @param {*} accessor
   */
  async run(turnContext, accessor) {
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
          // TODO: Render game card
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

    // const messageText = stepContext.options.restartMsg
    //   ? stepContext.options.restartMsg
    //   : 'Greetings!\n';
    // const promptMessage = MessageFactory.text(
    //   messageText,
    //   messageText,
    //   InputHints.ExpectingInput
    // );
    // await stepContext.prompt("TextPrompt", { prompt: promptMessage });

    const mainMenuCard = CardFactory.adaptiveCard(MainMenuCard);
    return await stepContext.context.sendActivity({ attachments: [mainMenuCard] });
  }

  async actStep(stepContext) {
    const bookingDetails = {};

    // if (!this.luisRecognizer.isConfigured) {
    //   // LUIS is not configured, we just run the BookingDialog path.
    //   return await stepContext.beginDialog("bookingDialog", bookingDetails);
    // }

    // Call LUIS and gather any potential booking details. (Note the TurnContext has the response to the prompt)
    const luisResult = await this.luisRecognizer.executeLuisQuery(
      stepContext.context
    );
    switch (LuisRecognizer.topIntent(luisResult)) {
      case "MainMenu": {
        const mainMenuCard = CardFactory.adaptiveCard(MainMenuCard);
        await stepContext.context.sendActivity({ attachments: [mainMenuCard] });
      }

      case "BookFlight": {
        // Extract the values for the composite entities from the LUIS result.
        const fromEntities = this.luisRecognizer.getFromEntities(luisResult);
        const toEntities = this.luisRecognizer.getToEntities(luisResult);

        // Show a warning for Origin and Destination if we can't resolve them.
        await this.showWarningForUnsupportedCities(
          stepContext.context,
          fromEntities,
          toEntities
        );

        // Initialize BookingDetails with any entities we may have found in the response.
        bookingDetails.destination = toEntities.airport;
        bookingDetails.origin = fromEntities.airport;
        bookingDetails.travelDate = this.luisRecognizer.getTravelDate(
          luisResult
        );
        console.log(
          "LUIS extracted these booking details:",
          JSON.stringify(bookingDetails)
        );

        // Run the BookingDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
        return await stepContext.beginDialog("bookingDialog", bookingDetails);
      }

      case "GetWeather": {
        // We haven't implemented the GetWeatherDialog so we just display a TODO message.
        const getWeatherMessageText = "TODO: get weather flow here";
        await stepContext.context.sendActivity(
          getWeatherMessageText,
          getWeatherMessageText,
          InputHints.IgnoringInput
        );
        break;
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
   * Shows a warning if the requested From or To cities are recognized as entities but they are not in the Airport entity list.
   * In some cases LUIS will recognize the From and To composite entities as a valid cities but the From and To Airport values
   * will be empty if those entity values can't be mapped to a canonical item in the Airport.
   */
  async showWarningForUnsupportedCities(context, fromEntities, toEntities) {
    const unsupportedCities = [];
    if (fromEntities.from && !fromEntities.airport) {
      unsupportedCities.push(fromEntities.from);
    }

    if (toEntities.to && !toEntities.airport) {
      unsupportedCities.push(toEntities.to);
    }

    if (unsupportedCities.length) {
      const messageText = `Sorry but the following airports are not supported: ${unsupportedCities.join(
        ", "
      )}`;
      await context.sendActivity(
        messageText,
        messageText,
        InputHints.IgnoringInput
      );
    }
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
}

module.exports.MainDialog = MainDialog;

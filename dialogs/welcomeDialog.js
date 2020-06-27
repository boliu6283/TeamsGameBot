// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog, WaterfallDialog, AttachmentPrompt } = require("botbuilder-dialogs");
const { CardFactory } = require('botbuilder-core');
const { RankDialog } = require('./rankDialog');
const { GameChoiceDialog } = require('./gameChoiceDialog');
const { getRandomPic } = require('../helpers/thumbnail');
const { menuPics } = require('../config/pics');
const constants = require('../config/constants');
const WelcomeCard = require('../static/welcomeCard.json');

class WelcomeDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.WELCOME_DIALOG);

    this._luisRecognizer = luisRecognizer;

    this._dialogs = [
      new GameChoiceDialog(luisRecognizer),
      new RankDialog(luisRecognizer)
    ];

    this.addDialog(new AttachmentPrompt(constants.WELCOME_CARD_PROMPT));
    this.addDialog(new WaterfallDialog(constants.WELCOME_WATERFALL_DIALOG, [
        this.welcomeStep.bind(this),
        this.welcomeChoiceStep.bind(this)
    ]));

    this.initialDialogId = constants.WELCOME_WATERFALL_DIALOG;
  }

  async welcomeStep(stepContext) {
    const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
    welcomeCard.content.body[0].text = `Hey ${stepContext.options.user.givenName}! Welcome to Game Bot!`
    welcomeCard.content.body[1].url = getRandomPic(menuPics);
    await stepContext.context.sendActivity({ attachments: [welcomeCard] });
    const promptOptions = { prompt: 'Please enter your name.' };
    return await stepContext.prompt(constants.WELCOME_CARD_PROMPT, promptOptions);

    // if (stepContext.context._activity.value) await stepContext.next();

    // return await stepContext.continueDialog();

  }

  async welcomeChoiceStep(stepContext) {
    stepContext.values.welcomeChoice = stepContext.result;
    return await stepContext.endDialog();
  }

  // async beginDialog(dc, options) {
  //   const input = dc.context._activity.value;
  //   if (input) {
  //     switch (input.mainMenuChoice) {
  //       case 'game': {
  //         await dc.beginDialog(constants.GAME_CHOICE_DIALOG, options);
  //         return dc.continueDialog();
  //       }

  //       case 'rank': {
  //         await dc.beginDialog(constants.RANK_DIALOG, options);
  //         return dc.endDialog();
  //       }

  //       case 'settings': {
  //         await dc.context.sendActivity('Settings button is not implemented');
  //         return dc.endDialog();
  //       }

  //       default: {
  //         await dc.context.sendActivity(`Unknown Command: ${input}`);
  //         return await dc.endDialog(`Unknown Command: ${input}`);
  //       }
  //     }
  //   }

  //   // If nothing is chosen, retry current dialog
  //   // TODO: This should be a separate prompt dialog, need to change it
  //   const mainMenuCard = CardFactory.adaptiveCard(MainMenuCard);
  //   mainMenuCard.content.body[0].text = `Hey ${options.user.givenName}! Welcome to Game Bot!`
  //   mainMenuCard.content.body[1].url = getRandomPic(menuPics);
  //   await dc.context.sendActivity({ attachments: [mainMenuCard] });
  //   return await dc.endDialog(constants.GAME_CHOICE_DIALOG);
  // }
}

module.exports = {
  WelcomeDialog
};

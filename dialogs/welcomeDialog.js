// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog, WaterfallDialog } = require("botbuilder-dialogs");
const { CardFactory, MessageFactory } = require('botbuilder-core');
const { RankDialog } = require('./rankDialog');
const { GameChoiceDialog } = require('./gameChoiceDialog');
const { getRandomPic } = require('../helpers/thumbnail');
const { menuPics } = require('../config/pics');
const constants = require('../config/constants');
const WelcomeCard = require('../static/welcomeCard.json');
const { ChoicePrompt } = require("botbuilder-dialogs");

class WelcomeDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.WELCOME_DIALOG);

    this._luisRecognizer = luisRecognizer;

    this.addDialog(new ChoicePrompt('AdaptiveCardPrompt'));
    this.addDialog(new WaterfallDialog(constants.WELCOME_WATERFALL_DIALOG, [
        this.welcomeStep.bind(this),
        this.welcomeChoiceStep.bind(this)
    ]));
    this.addDialog(new GameChoiceDialog(luisRecognizer));
    this.addDialog(new RankDialog(luisRecognizer));

    this.initialDialogId = constants.WELCOME_WATERFALL_DIALOG;
  }

  async welcomeStep(stepContext) {
    const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
    welcomeCard.content.body[0].text = `Hey ${stepContext.options.user.givenName}! Welcome to Game Bot!`
    welcomeCard.content.body[1].url = getRandomPic(menuPics);
    const promptId = await stepContext.prompt('AdaptiveCardPrompt', {
      choices: ['game', 'rank'],
      prompt: MessageFactory.attachment(welcomeCard)
    });
    console.log(`promptId ${promptId}`);
    return promptId;
  }

  async welcomeChoiceStep(stepContext) {
    switch (stepContext.result.value.toLowerCase()) {
      case 'game': {
        return await stepContext.replaceDialog(constants.GAME_CHOICE_DIALOG, stepContext.options);
      }

      case 'rank': {
        return await stepContext.replaceDialog(constants.RANK_DIALOG, stepContext.options);
      }
    }

    return await stepContext.endDialog();
  }
}

module.exports = {
  WelcomeDialog
};

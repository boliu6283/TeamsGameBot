// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog, WaterfallDialog } = require("botbuilder-dialogs");
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

    this.addDialog(new WaterfallDialog(constants.WELCOME_WATERFALL_DIALOG, [
        this.welcomeStep.bind(this),
        this.welcomeChoiceStep.bind(this)
    ]));
    this.addDialog(new GameChoiceDialog(luisRecognizer));
    this.addDialog(new RankDialog(luisRecognizer));

    this.initialDialogId = constants.WELCOME_WATERFALL_DIALOG;
  }

  async welcomeStep(stepContext) {
    if (stepContext.context._activity.value) {
      return await stepContext.next();
    }
    const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
    welcomeCard.content.body[0].text = `Hey ${stepContext.options.user.givenName}! Welcome to Game Bot!`
    welcomeCard.content.body[1].url = getRandomPic(menuPics);
    await stepContext.context.sendActivity({ attachments: [welcomeCard] });
    return await stepContext.endDialog();
  }

  async welcomeChoiceStep(stepContext) {
    switch (stepContext.context._activity.value.welcomeChoice) {
      case 'game': {
        await stepContext.beginDialog(constants.GAME_CHOICE_DIALOG, stepContext.options);
        return stepContext.continueDialog();
      }

      case 'rank': {
        await stepContext.beginDialog(constants.RANK_DIALOG, stepContext.options);
        return stepContext.endDialog();
      }
    }

    return await stepContext.endDialog();
  }
}

module.exports = {
  WelcomeDialog
};

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { Dialog, ComponentDialog, WaterfallDialog } = require("botbuilder-dialogs");
const { CardFactory } = require('botbuilder-core');
const { RankDialog } = require('./rankDialog');
const { GameChoiceDialog } = require('./gameChoiceDialog');
const { JoinSessionDialog } = require('./joinSessionDialog');
const { getRandomPic } = require('../helpers/thumbnail');
const { menuPics } = require('../config/pics');
const constants = require('../config/constants');
const WelcomeCard = require('../static/welcomeCard.json');

class WelcomeDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.WELCOME_DIALOG);

    this._luisRecognizer = luisRecognizer;

    this.addDialog(new WaterfallDialog(constants.WELCOME_WATERFALL_DIALOG, [
        this.welcomeCardStep.bind(this),
        this.welcomeChoiceStep.bind(this)
    ]));
    this.addDialog(new GameChoiceDialog(luisRecognizer));
    this.addDialog(new RankDialog(luisRecognizer));
    this.addDialog(new JoinSessionDialog(luisRecognizer));

    this.initialDialogId = constants.WELCOME_WATERFALL_DIALOG;
  }

  async welcomeCardStep(stepContext) {
    let welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
    welcomeCard.content.body[0].text = `Hey ${stepContext.options.user.givenName}! Welcome to Game Bot!`
    welcomeCard.content.body[1].url = getRandomPic(menuPics);
    if (stepContext.options.lastActivityId) {
      await stepContext.context.deleteActivity(stepContext.options.lastActivityId);
    }
    stepContext.options.lastActivityId = (await stepContext.context.sendActivity({ attachments: [welcomeCard] })).id;

    return Dialog.EndOfTurn;
  }

  async welcomeChoiceStep(stepContext) {
    const choice = stepContext.context._activity.value;
    if (!choice) {
      return await stepContext.replaceDialog(constants.WELCOME_DIALOG, stepContext.options);
    }

    switch (choice.welcomeChoice) {
      case 'host': {
        return await stepContext.replaceDialog(constants.GAME_CHOICE_DIALOG, stepContext.options);
      }

      case 'join': {
        return await stepContext.replaceDialog(constants.JOIN_SESSION_DIALOG, stepContext.options);
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

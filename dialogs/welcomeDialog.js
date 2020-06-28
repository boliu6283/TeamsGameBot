// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog, WaterfallDialog, ChoicePrompt } = require("botbuilder-dialogs");
const { CardFactory, MessageFactory } = require('botbuilder-core');
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

    this.addDialog(new ChoicePrompt(constants.WELCOME_CARD_PROMPT));
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

    return await stepContext.prompt(constants.WELCOME_CARD_PROMPT, {
      prompt: MessageFactory.attachment(welcomeCard),
      choices: ['🕹️Game', '📖Rank', '🪑Join']
    });
  }

  async welcomeChoiceStep(stepContext) {
    switch (stepContext.result.value) {
      case '🕹️Game': {
        return await stepContext.replaceDialog(constants.GAME_CHOICE_DIALOG, stepContext.options);
      }

      case '📖Rank': {
        return await stepContext.replaceDialog(constants.RANK_DIALOG, stepContext.options);
      }

      case '🪑Join': {
        return await stepContext.replaceDialog(constants.JOIN_SESSION_DIALOG, stepContext.options);
      }
    }

    return await stepContext.endDialog();
  }
}

module.exports = {
  WelcomeDialog
};

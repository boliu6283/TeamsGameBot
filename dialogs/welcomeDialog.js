// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog } = require("botbuilder-dialogs");
const { CardFactory } = require('botbuilder-core');
const { getRandomPic, menuPics } = require('../helpers/thumbnail');
const constants = require('../constants')
const MainMenuCard = require('../static/mainMenuCard.json');

class WelcomeDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.WELCOME_DIALOG);

    // Dependency Injections from parent MainDialog
    this._luisRecognizer = luisRecognizer;
  }

  async beginDialog(dc, options) {
    const input = dc.context._activity.value;
    if (input) {
      switch (input.mainMenuChoice) {
        case 'game': {
          await dc.beginDialog(constants.GAME_CHOICE_DIALOG, options);
          return dc.continueDialog();
        }

        case 'rank': {
          await dc.context.sendActivity('Rank button is not implemented');
          return dc.endDialog();
        }

        case 'settings': {
          await dc.context.sendActivity('Settings button is not implemented');
          return dc.endDialog();
        }

        default: {
          await dc.context.sendActivity(`Unknown Command: ${input}`);
          return await dc.endDialog(`Unknown Command: ${input}`);
        }
      }
    }

    // If nothing is chosen, retry current dialog
    // TODO: This should be a separate prompt dialog, need to change it
    const mainMenuCard = CardFactory.adaptiveCard(MainMenuCard);
    mainMenuCard.content.body[1].url = getRandomPic(menuPics);
    await dc.context.sendActivity({ attachments: [mainMenuCard] });
    return await dc.endDialog(constants.GAME_CHOICE_DIALOG);
  }
}

module.exports = {
  WelcomeDialog
};

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog, WaterfallDialog, ChoicePrompt } = require("botbuilder-dialogs");
const { CardFactory, MessageFactory } = require('botbuilder-core');
const constants = require('../config/constants');
const SpyfallRoles = require('../static/spyfall.json');
const SpyfallCard = require('../static/spyfallCard.json');
const Resolvers = require('../resolvers');

class SpyfallDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.SPYFALL_DIALOG);
    this._luisRecognizer = luisRecognizer;
    this.addDialog(new ChoicePrompt(constants.SPYFALL_PROMPT));
    this.addDialog(new WaterfallDialog(constants.SPYFALL_WATERFALL_DIALOG, [
        this.distributeRoleStep.bind(this),
        this.restartStep.bind(this)
    ]));

    this.initialDialogId = constants.SPYFALL_WATERFALL_DIALOG;
  }

  getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }


  async distributeRoleStep(stepContext) {
    const startGameArgs = stepContext.context.activity.value.msteams;
    const sessionCode = startGameArgs.text;
    let session = await Resolvers.gameSession.getSession({ code: sessionCode });
    const location = SpyfallRoles.locations[this.getRandomInt(SpyfallRoles.locations.length)];
    const spyIndex = this.getRandomInt(session.players.length+1);
    session.players.forEach(async (player, index)=>{
      let role = '';
      if(index == spyIndex){
        role='Spy';
      } else {
        role = SpyfallRoles[`location.${location}.role${(index+spyIndex)%7 + 1}`];
      }
      const playerCard = CardFactory.adaptiveCard(SpyfallCard);
      playerCard.content.body[0].text = 'Location: '+location;
      playerCard.content.body[1].text = 'Role: ' + role;
      await Resolvers.proactiveMessage.notifyIndividualCard(player.aad, playerCard);
    });

    let hostSpyfallCard = CardFactory.adaptiveCard(SpyfallCard);
    hostSpyfallCard.content.body[0].text = 'Location: '+location;
    let hostRole = '';
    if(spyIndex == session.players.length){
      hostRole = 'Spy';
    } else {
      hostRole = SpyfallRoles[`location.${location}.role${(spyIndex)%7 + 1}`];
    }
    hostSpyfallCard.content.body[1].text = 'Role: ' + hostRole;

    return await stepContext.prompt(constants.SPYFALL_PROMPT, {
      prompt: MessageFactory.attachment(hostSpyfallCard),
      choices: ['🕹️StartAnotherMatch', '📖EndGame']
    });
  }

  async restartStep(stepContext) {
    switch (stepContext.result.value) {
      case '🕹️StartAnotherMatch': {
        return await stepContext.replaceDialog(constants.SPYFALL_DIALOG, stepContext.options);
      }

      case '📖EndGame': {
        return await stepContext.endDialog();
      }
    }

    return await stepContext.endDialog();
  }
}

module.exports = {
  SpyfallDialog
};

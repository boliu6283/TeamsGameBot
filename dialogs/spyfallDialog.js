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

    for(let i = 0; i < SpyfallRoles.locations.length; i++){
      const locationItem = {
        type:'TextBlock',
        text:SpyfallRoles.locations[i]
      }
      if(i%2==0){
        SpyfallCard.body[1].columns[0].items.push(locationItem);
      }else{
        SpyfallCard.body[1].columns[1].items.push(locationItem);
      }
    }

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
      const playerCard = CardFactory.adaptiveCard(SpyfallCard);
      if(index == spyIndex){
        playerCard.content.body[3].text = 'Role: Spy';
        playerCard.content.body[2].text = 'Location: (empty, try guess)';
      } else {
        playerCard.content.body[3].text = 'Role: ' + SpyfallRoles[`location.${location}.role${(index+spyIndex)%7 + 1}`];
        playerCard.content.body[2].text = 'Location: '+location;
      }
      await Resolvers.proactiveMessage.notifyIndividualCard(player.aad, playerCard);
    });

    let hostSpyfallCard = CardFactory.adaptiveCard(SpyfallCard);
    if(spyIndex == session.players.length){
      hostSpyfallCard.content.body[3].text = 'Role: Spy';
      hostSpyfallCard.content.body[2].text = 'Location: (empty, try guess)';
    } else {
      hostSpyfallCard.content.body[3].text = 'Role: ' + SpyfallRoles[`location.${location}.role${(spyIndex)%7 + 1}`];
      hostSpyfallCard.content.body[2].text = 'Location: '+location;
    }

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

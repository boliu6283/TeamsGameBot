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
        this.startGameSession.bind(this),
        this.registerCountdown.bind(this),
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

  async startGameSession(stepContext) {
    // Only host's proactive card response will have msteams session code
    const startGameArgs = stepContext.context.activity.value.msteams;
    if (startGameArgs) {
      const sessionCode = startGameArgs.text;
      const lifespan = constants.DEFAULT_SPYFALL_LIFESPAN_SEC;

      await Resolvers.proactiveMessage.notifySession(
        sessionCode,
        `Spyfall ${sessionCode} is now started, try to find the spy in ${lifespan} seconds`);

      // TODO: lifespan should be adjustable based on the number of players
      await Resolvers.gameSession.startSession({
        code: sessionCode,
        lifespanSec: lifespan
      });
    }
    return stepContext.next();
  }

  async registerCountdown(stepContext) {
    // Only the host needs to register the countdown timer
    const startGameArgs = stepContext.context.activity.value.msteams;
    if (startGameArgs) {
      const sessionCode = startGameArgs.text;

      // To prevent the host from keep clicking on the proactive card
      // We should only register the timer once at a time
      await Resolvers.countdown.register(
        sessionCode,
        constants.DEFAULT_COUNTDOWN_INTERVAL_SEC,
        async () => {
          // TODO: handle win logic and prompt retry card
          await Resolvers.proactiveMessage.notifySession(
            sessionCode, `Spyfall ${sessionCode} is now finished, spy wins`);
        });
    }
    return await stepContext.next();
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

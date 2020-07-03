const { Dialog, ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder-core');
const Resolvers = require('../../../resolvers');
const constants = require('../../../config/constants');
const PollResultCollectorCard = require('../static/pollResultCollectorCard.json');

// This dialog will proactively engage each user to make decision on the raised poll
// The poll result will be collected in SpyFallPollResultCollectDialog
//
class SpyFallRaisePollDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.SPYFALL_RAISE_POLL_DIALOG);

    this._luisRecognizer = luisRecognizer;
  }

  async beginDialog(dc, options) {
    // 1. The poll is raised by the player, create a card and proactively engage every player.
    //    The card will be a Agree/Disagree selection card.
    let pollResultCollectorCard = CardFactory.adaptiveCard(PollResultCollectorCard);
    pollResultCollectorCard.content.body[0].text = `Player {} raised the poll to disclose {} as a spy`;

    // 3. All responses from players will be collected in SpyFallResultCollectDialog.
    

    // 4. Once SpyFallResultCollectDialog finishes on data collecting, it will pop the result.

    // 5. If it is a wrong guess, we need to restart the spyfallDialog. BUT we need to carefully 
    //    handle startGameSession and registerCountdown 2 steps. Since those 2 steps are for a fresh match.
    //    Besides, in the distributeRoleStep, we need to, at least, disable the vote button for the guy who is
    //    regarded as a spy on the previous round. Because he is dead man.
    //    In this way, we can achieve the multiple guesses. 
  }
}

module.exports = {
  SpyFallRaisePollDialog
};
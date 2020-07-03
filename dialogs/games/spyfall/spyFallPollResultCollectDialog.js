const { Dialog, ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder-core');
const Resolvers = require('../../../resolvers');
const constants = require('../../../config/constants');

// This dialog will proactively engage each user to make decision
// on the raised poll.
// The poll result will be collected in SpyFallResultCollectDialog
//
class SpyFallPollResultCollectDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.spyfallResultCollectDialog);

    this._luisRecognizer = luisRecognizer;
  }

  async beginDialog(dc, options) {
    // TODO: Follow the pattern of the JoinSessionDialog
    // We might need to use a dictionary or hashmap here to record the poll information
    // for differet session. (Race condition? Should we use CurrentHashMap here?)
    // Once we collect enough information for a specific session, we need to show the poll result
    // and determine the game state. 
    // 1. If this is a good guess, we can end the game.
    // 2, If this is a bad guess, we have to re-enter the spyFallDialog <-- this part will be a challenge...
  }
}

module.exports = {
  SpyFallPollResultCollectDialog
};

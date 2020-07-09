const { Dialog } = require('botbuilder-dialogs');
const Resolvers = require('../../../resolvers');
const constants = require('../../../config/constants');

class SpyfallGuessDialog extends Dialog {
  constructor(luisRecognizer) {
    super(constants.SPYFALL_GUESS_DIALOG);

    this._luisRecognizer = luisRecognizer;
  }

  async beginDialog(dc, options) {
    const { spyGuess, location, sessionCode } = dc.context.activity.value;
    await Resolvers.countdown.resume(sessionCode);
    await Resolvers.countdown.kill(sessionCode);
    if (spyGuess.toLowerCase() === location) {
      await Resolvers.proactiveMessage.notifySession(
        sessionCode,
        `**Spyfall ${sessionCode} is now finished, spy wins!**`
      );
    } else {
      await Resolvers.proactiveMessage.notifySession(
        sessionCode,
        `**Spyfall ${sessionCode} is now finished, players win!**`
      );
    }

    return await dc.endDialog();
  }
}

module.exports = {
  SpyfallGuessDialog
};

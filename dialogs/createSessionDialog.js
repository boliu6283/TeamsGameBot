const { Dialog } = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder-core');
const Resolvers = require('../resolvers');
const constants = require('../config/constants');
const CreateSessionCard = require('../static/createSessionCard.json');

class CreateSessionDialog extends Dialog {
  constructor(luisRecognizer) {
    super(constants.CREATE_SESSION_DIALOG);
    this._luisRecognizer = luisRecognizer;
  }

  async beginDialog(dc, options) {
    // Find the chosen game.
    //
    const chosenGame = options.gameChoice;
    const gameInfo = await Resolvers.game.getGameByName({ gameName: chosenGame });

    // Get host info.
    //
    const userInfo = options.user;

    // Generate code
    //
    let roomCode = await generateUniqueSessionCode();

    // Generate game session
    //
    await Resolvers.gameSession.createSession({ code: roomCode, game: gameInfo._id, host: userInfo._id});

    // Render session creation card.
    //
    let createSessionCard = CardFactory.adaptiveCard(CreateSessionCard);
    createSessionCard.content.body[0].items[0].columns[0].items[0].text = gameInfo.name;
    createSessionCard.content.body[0].items[0].columns[0].items[1].url = gameInfo.profile;
    createSessionCard.content.body[0].items[0].columns[0].items[2].text = `**Rules:** \n\n ${gameInfo.rules}`;
    createSessionCard.content.body[0].items[0].columns[0].items[3].text = `Room code: ${roomCode.toString()}`;

    await dc.context.sendActivity({ attachments: [createSessionCard] });

    return dc.endDialog();
  }
}

async function generateUniqueSessionCode() {
  let roomCode = _generateCode();
  while (await Resolvers.gameSession.doesSessionExist(roomCode)) {
    roomCode = _generateCode();
  }
  return roomCode;
}

async function _generateCode() {
  return 'xxxx'.replace(/[x]/g, function(c) {
     var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
     return v.toString(16);
  });
}

module.exports = {
  CreateSessionDialog,
  generateUniqueSessionCode
};

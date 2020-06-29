const { TurnContext } = require('botbuilder-core');
const BotAdapter = require('./botAdapter');
const GameSession = require('./gameSession');

let _conversationReferences = {};

const notifyIndividual = async (userAad, message) => {
  const adapter = BotAdapter.getInstance();
  if (_conversationReferences[userAad]) {
    const cref = _conversationReferences[userAad];
    await adapter.continueConversation(cref, async turnContext => {
      await turnContext.sendActivity(message);
    });
  }
}

const notifyIndividualCard = async(userAad, card) => {
  const adapter = BotAdapter.getInstance();
  if (_conversationReferences[userAad]) {
    const cref = _conversationReferences[userAad];
    await adapter.continueConversation(cref, async turnContext => {
      await turnContext.sendActivity({attachments: [card]});
    });
  }
}
// sessionCode = RoomNumber, RoomCode, SessionCode
const notifySession = async (sessionCode, message) => {
  const session = await GameSession.getSession({ code: sessionCode });
  session.players.forEach(async (p) => {
    await notifyIndividual(p.aad, message);
  });
}

const notifyAll = async (message) => {
  Object.keys(_conversationReferences).forEach(async (k) => {
    await notifyIndividual(k, message);
  });
}

const addConversationReference = (context) => {
  const cref = TurnContext.getConversationReference(context.activity);
  const userId = cref.user.aadObjectId || cref.user.id;
  _conversationReferences[userId] = cref;
}

module.exports = {
  addConversationReference,
  notifyAll,
  notifySession,
  notifyIndividual,
  notifyIndividualCard,
}

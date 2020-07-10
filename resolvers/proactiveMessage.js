const { MessageFactory } = require('botbuilder');
const { TurnContext, CardFactory } = require('botbuilder-core');
const BotAdapter = require('./botAdapter');
const GameSession = require('./gameSession');

// userId = userAad | userObjectId
// { userId: { turnContext: turnContext, updatables: { updatableId: activityId } }}
let _conversationReferences = {};

const notifyIndividual = async (userId, message) => {
  const adapter = BotAdapter.getInstance();
  if (_conversationReferences[userId]) {
    const cref = _conversationReferences[userId].turnContext;
    let activityId = null;
    await adapter.continueConversation(cref, async turnContext => {
      const messageContext = MessageFactory.text(message);
      const activityContext = await turnContext.sendActivity(messageContext);
      activityId = activityContext.id;
    });
    return activityId;
  }
}

// In BotEmulator, this functionality is not usable due to Web Chat limitation
// https://github.com/microsoft/BotFramework-Emulator/issues/1123

// Update the previous proactive message card according to updatableId
// If there's no previous message, create a new one on the updatableId
const notifyUpdatableIndividual = async (userId, message, updatableId) => {
  const adapter = BotAdapter.getInstance();
  if (_conversationReferences[userId]) {
    const cref = _conversationReferences[userId].turnContext;
    const updatables = _conversationReferences[userId].updatables;

    await adapter.continueConversation(cref, async turnContext => {
      const messageContext = MessageFactory.text(message);
      // If a conversation has updatable id, we update the last message
      // Otherwise, we create a new activity
      if (updatables[updatableId]) {
        messageContext.id = updatables[updatableId];
        await turnContext.updateActivity(messageContext);
      } else {
        updatables[updatableId] = await notifyIndividual(userId, message);
      }
    });
  }
}

const notifyUpdatableIndividualCard = async (userId, card, updatableId) => {
  const adapter = BotAdapter.getInstance();
  if (_conversationReferences[userId]) {
    const cref = _conversationReferences[userId].turnContext;
    const updatables = _conversationReferences[userId].updatables;

    await adapter.continueConversation(cref, async turnContext => {
      const cardContext = CardFactory.adaptiveCard(card);
      if (updatables[updatableId]) {
        cardContext.id = updatables[updatableId];
        await turnContext.updateActivity(cardContext);
      } else {
        updatables[updatableId] = await notifyIndividualCard(userId, card);
      }
    });
  }
}

// Delete updatable messages
const deleteUpdatableIndividual = async (userId, updatableId) => {
  const adapter = BotAdapter.getInstance();
  if (_conversationReferences[userId]) {
    const cref = _conversationReferences[userId].turnContext;
    const updatables = _conversationReferences[userId].updatables;

    await adapter.continueConversation(cref, async turnContext => {
      // If a conversation has updatable id, we update the last message
      // Otherwise, we create a new activity
      if (updatables[updatableId]) {
        await turnContext.deleteActivity(updatables[updatableId]);
        delete updatables[updatableId];
      }
    });
  }
}

const notifyIndividualCard = async(userId, card) => {
  const adapter = BotAdapter.getInstance();
  if (_conversationReferences[userId]) {
    const cref = _conversationReferences[userId].turnContext;
    let activityId = null;
    await adapter.continueConversation(cref, async turnContext => {
      const activityContext = await turnContext.sendActivity({attachments: [card]});
      activityId = activityContext.id;
    });
    return activityId;
  }
}

const notifySession = async (sessionCode, message) => {
  const session = await GameSession.getSession({ code: sessionCode });
  session.players.forEach(async (p) => {
    await notifyIndividual(p.aad, message);
  });
  await notifyIndividual(session.host.aad, message);
}

const notifyUpdatableSession = async (sessionCode, message, updatableId) => {
  const session = await GameSession.getSession({ code: sessionCode });
  session.players.forEach(async (p) => {
    await notifyUpdatableIndividual(p.aad, message, updatableId);
  });
  await notifyUpdatableIndividual(session.host.aad, message, updatableId);
}

const notifyUpdatableSessionCard = async (sessionCode, card, updatableId) => {
  const session = await GameSession.getSession({ code: sessionCode });
  session.players.forEach(async (p) => {
    await notifyUpdatableIndividualCard(p.aad, card, updatableId);
  });
  await notifyUpdatableIndividualCard(session.host.aad, card, updatableId);
}

const deleteUpdatableSession = async (sessionCode, updatableId) => {
  const session = await GameSession.getSession({ code: sessionCode });
  session.players.forEach(async (p) => {
    await deleteUpdatableIndividual(p.aad, updatableId);
  });
  await deleteUpdatableIndividual(session.host.aad, updatableId);
}

const notifyAll = async (message) => {
  Object.keys(_conversationReferences).forEach(async (k) => {
    await notifyIndividual(k, message);
  });
}

const addConversationReference = (context) => {
  const cref = TurnContext.getConversationReference(context.activity);
  const userId = cref.user.aadObjectId || cref.user.id;
  if (!_conversationReferences[userId]) {
    _conversationReferences[userId] = {};
    _conversationReferences[userId].updatables = {};
  }
  _conversationReferences[userId].turnContext = cref;
}

module.exports = {
  addConversationReference,
  notifyAll,
  notifyIndividual,
  notifyIndividualCard,
  notifySession,
  notifyUpdatableIndividual,
  notifyUpdatableIndividualCard,
  notifyUpdatableSession,
  notifyUpdatableSessionCard,
  deleteUpdatableIndividual,
  deleteUpdatableSession
}

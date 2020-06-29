const { TurnContext } = require('botbuilder-core');
const BotAdapter = require('./botAdapter');

const conversationReferences = {};

async function notifyAll(message) {
  const adapter = BotAdapter.getInstance();
  for (const conversationReference of Object.values(conversationReferences)) {
    await adapter.continueConversation(conversationReference, async turnContext => {
      await turnContext.sendActivity(message);
    });
  }
}

function addConversationReference(context) {
  const conversationReference = TurnContext.getConversationReference(context.activity);
  this.conversationReferences[conversationReference.user.aadObjectId] = conversationReference;
}

module.exports = {
  conversationReferences,
  addConversationReference,
  notifyAll
}

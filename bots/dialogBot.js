// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TurnContext } = require('botbuilder-core');
const { ActivityHandler } = require('botbuilder');
const constants = require('../config/constants');

class DialogBot extends ActivityHandler {
  constructor(conversationReferences, conversationState, userState, dialog) {
    super();
    if (!conversationReferences)
      throw new Error('[DialogBot]: Missing parameter. conversationReferences is required');
    if (!conversationState)
      throw new Error('[DialogBot]: Missing parameter. conversationState is required');
    if (!userState)
      throw new Error('[DialogBot]: Missing parameter. userState is required');
    if (!dialog)
      throw new Error('[DialogBot]: Missing parameter. dialog is required');

    this.conversationReferences = conversationReferences;
    this.conversationState = conversationState;
    this.userState = userState;
    this.dialog = dialog;

    // Create temporary state storage in conversationState.DialogState property
    this.dialogStateAccessor = this.conversationState.createProperty(
      constants.DIALOG_STATE);
    this.userProfileStateAccessor = this.userState.createProperty(
      constants.USER_PROFILE_STATE);

    // Activity Handlers
    // https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics?view=azure-bot-service-4.0&tabs=csharp#bot-logic
    this.onMessage(async (context, next) => {
      console.log('Running dialog with Message Activity.');
      // Storing conversation reference for proactive message
      this.addConversationReference(context.activity);

      // Pass dialogState and userProfileState into mainDialog.run() function
      await this.dialog.run(context, this.dialogStateAccessor, this.userProfileStateAccessor);
      await next();
    });

    this.onDialog(async (context, next) => {
      await this.conversationState.saveChanges(context, false);
      await this.userState.saveChanges(context, false);
      await next();
    });
  }

  addConversationReference(activity) {
    const conversationReference = TurnContext.getConversationReference(activity);
    this.conversationReferences[conversationReference.conversation.id] = conversationReference;
  }
}

module.exports.DialogBot = DialogBot;

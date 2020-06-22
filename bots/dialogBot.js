// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler } = require('botbuilder');

class DialogBot extends ActivityHandler {
  constructor(conversationState, userState, dialog) {
    super();
    if (!conversationState)
      throw new Error('[DialogBot]: Missing parameter. conversationState is required');
    if (!userState)
      throw new Error('[DialogBot]: Missing parameter. userState is required');
    if (!dialog)
      throw new Error('[DialogBot]: Missing parameter. dialog is required');

    this.conversationState = conversationState;
    this.userState = userState;
    this.dialog = dialog;
    this.dialogState = this.conversationState.createProperty('DialogState');

    // Activity Handlers
    // https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics?view=azure-bot-service-4.0&tabs=csharp#bot-logic
    this.onMessage(async (context, next) => {
      console.log('Running dialog with Message Activity.');
      await this.dialog.run(context, this.dialogState);
      await next();
    });

    this.onDialog(async (context, next) => {
      await this.conversationState.saveChanges(context, false);
      await this.userState.saveChanges(context, false);
      await next();
    });
  }
}

module.exports.DialogBot = DialogBot;

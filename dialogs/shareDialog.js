const { Dialog, ComponentDialog, WaterfallDialog } = require("botbuilder-dialogs");
const { CardFactory } = require('botbuilder-core');
const constants = require('../config/constants');
const { getRandomPic } = require('../helpers/thumbnail');
const { sharePics } = require('../config/pics')
const ShareCard = require('../static/shareCard.json');

class ShareDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.SHARE_DIALOG);
    this._luisRecognizer = luisRecognizer;

    this.addDialog(new WaterfallDialog(constants.SHARE_WATERFALL_DIALOG, [
      this.shareCardStep.bind(this),
      this.shareChoiceStep.bind(this)
    ]));

    this.initialDialogId = constants.SHARE_WATERFALL_DIALOG;
  }

  async shareCardStep(stepContext) {
    const shareCard = CardFactory.adaptiveCard(JSON.parse(JSON.stringify(ShareCard)));
    shareCard.content.body[0].url = getRandomPic(sharePics);
    shareCard.content.body[2].text = constants.DOMAIN + constants.HOME_PATH;

    await stepContext.context.deleteActivity(stepContext.options.lastActivityId);
    stepContext.options.lastActivityId = (await stepContext.context.sendActivity({ attachments: [shareCard] })).id;

    return Dialog.EndOfTurn;
  }

  async shareChoiceStep(stepContext) {
    const choice = stepContext.context._activity.value;
    if (!choice) {
      return await stepContext.replaceDialog(constants.RANK_DIALOG, stepContext.options);
    }

    switch(choice.shareChoice) {
      case 'share': {
        const topic = 'Join Jolly!!!';
        const msg = `[Click here to play games with me on Jolly!!!](${encodeURI(constants.BOT_URL)})`;
        const chatUrl = encodeURI(`${constants.TEAMS_CHAT_URL}${choice.email}&topicName=${topic}&message=${msg}`);
        await stepContext.context.sendActivity(`[Click here to share Jolly!](${chatUrl})`);
        return await stepContext.endDialog();
      }

      case 'back': {
        return await stepContext.replaceDialog(constants.WELCOME_DIALOG, stepContext.options);
      }
    }
  }
}

module.exports = {
  ShareDialog
};

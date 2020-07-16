const { Dialog, ComponentDialog, WaterfallDialog } = require("botbuilder-dialogs");
const { CardFactory } = require('botbuilder-core');
const Resolvers = require('../resolvers');
const constants = require('../config/constants');
const { rankPics, rankMedals } = require('../config/pics')
const RankCard = require('../static/rankCard.json');

class RankDialog extends ComponentDialog {
  constructor(luisRecognizer) {
    super(constants.RANK_DIALOG);
    this._luisRecognizer = luisRecognizer;

    this.addDialog(new WaterfallDialog(constants.RANK_WATERFALL_DIALOG, [
      this.rankCardStep.bind(this),
      this.rankChoiceStep.bind(this)
    ]));

    this.initialDialogId = constants.RANK_WATERFALL_DIALOG;
  }

  async rankCardStep(stepContext) {
    const usersScore = (await Resolvers.user.getAllUsersScore()).slice(0, 10);
    const rankcard = CardFactory.adaptiveCard(JSON.parse(JSON.stringify(RankCard)));
    rankcard.content.body[0].url = rankPics[0];
    usersScore.forEach((user, index) => {
      rankcard.content.body[1].items[0].columns[0].items.push({
        type: 'TextBlock',
        text: index > 2 ? (index + 1).toString() : rankMedals[index + 1],
        horizontalAlignment: 'center',
        weight: 'Bolder'
      });
      rankcard.content.body[1].items[0].columns[1].items.push({
        type: 'TextBlock',
        text: user.name,
        horizontalAlignment: 'center',
        weight: 'Bolder'
      });
      rankcard.content.body[1].items[0].columns[2].items.push({
        type: 'TextBlock',
        text: user.score.toString(),
        horizontalAlignment: 'center',
        weight: 'Bolder'
      });
    });

    rankcard.content.actions[0].card.body[0].columns[0].items[0].text = `${stepContext.options.user.name}`;
    rankcard.content.actions[0].card.body[0].columns[1].items[0].text = `${stepContext.options.user.score}`;

    await stepContext.context.deleteActivity(stepContext.options.lastActivityId);
    stepContext.options.lastActivityId = (await stepContext.context.sendActivity({ attachments: [rankcard] })).id;

    return Dialog.EndOfTurn;
  }

  async rankChoiceStep(stepContext) {
    const choice = stepContext.context._activity.value;
    if (!choice) {
      return await stepContext.replaceDialog(constants.RANK_DIALOG, stepContext.options);
    }

    switch(choice.rankChoice) {
      case 'back': {
        return await stepContext.replaceDialog(constants.WELCOME_DIALOG, stepContext.options);
      }
    }
  }
}

module.exports = {
  RankDialog
};

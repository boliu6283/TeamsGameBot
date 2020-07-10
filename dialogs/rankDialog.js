const { Dialog } = require("botbuilder-dialogs");
const { CardFactory } = require('botbuilder-core');
const Resolvers = require('../resolvers');
const constants = require('../config/constants');
const { rankPics, rankMedals } = require('../config/pics')
const RankCard = require('../static/rankCard.json');

class RankDialog extends Dialog {
  constructor(luisRecognizer) {
    super(constants.RANK_DIALOG);

    // Dependency Injections from parent MainDialog
    this._luisRecognizer = luisRecognizer;
  }

  async beginDialog(dc, options) {
    // Clean up RankCard
    RankCard.body[1].items[0].columns[0].items = [];
    RankCard.body[1].items[0].columns[1].items = [];
    RankCard.body[1].items[0].columns[2].items = [];

    const usersScore = (await Resolvers.user.getAllUsersScore()).slice(0, 10);
    const rankcard = CardFactory.adaptiveCard(RankCard);
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

    await dc.context.sendActivity({ attachments: [rankcard] });
    return await dc.endDialog();
  }
}

module.exports = {
  RankDialog
};

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
    const usersScore = (await Resolvers.user.getAllUsersScore()).slice(0, 10);
    const rankcard = CardFactory.adaptiveCard(RankCard);
    rankcard.content.body[0].url = rankPics[0];
    let i = 1;
    usersScore.forEach(user => {
      rankcard.content.body[1].items[0].columns[0].items.push({
        type: 'TextBlock',
        text: i > 3 ? i : rankMedals[i],
        horizontalAlignment: 'left',
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
        text: user.score,
        horizontalAlignment: 'right',
        weight: 'Bolder'
      });
      i++;
    });
    
    await dc.context.sendActivity({ attachments: [rankcard] });
    return await dc.endDialog(constants.RANK_DIALOG);
  }
}

module.exports = {
  RankDialog
};

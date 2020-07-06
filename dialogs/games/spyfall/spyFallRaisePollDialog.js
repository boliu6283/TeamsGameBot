const { Dialog} = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder-core');
const Resolvers = require('../../../resolvers');
const constants = require('../../../config/constants');
const PollResultCollectorCard = require('../../../static/pollResultCollectorCard.json');

// This dialog will proactively engage each user to make decision on the raised poll
// The poll result will be collected in SpyFallPollResultCollectDialog
//
class SpyFallRaisePollDialog extends Dialog {
  constructor(luisRecognizer) {
    super(constants.SPYFALL_RAISE_POLL_DIALOG);

    this._luisRecognizer = luisRecognizer;
  }

  async beginDialog(dc, options) {
    // 1. The poll is raised by the player, create a card and proactively engage every player.
    //    The card will be a Agree/Disagree selection card.
    //
    const raisedPollInfo = dc.context.activity.value;
    const relatedSession = await Resolvers.gameSession.getSession({ code: raisedPollInfo.sessionCode });

    relatedSession.players.push(relatedSession.host);
    const raiseGuyInfo = relatedSession.players[raisedPollInfo.playerVote];
    const trueSpyInfo = relatedSession.players[raisedPollInfo.spyIdx];
    const selectedPlayerInfo = await Resolvers.user.getUser({ aad: raisedPollInfo.selectedPersonAAD });
    const isRightGuess = selectedPlayerInfo.aad === trueSpyInfo.aad;
    
    // 2. Pause the countdown.
    //
    await Resolvers.countdown.pause(raisedPollInfo.sessionCode);

    // 3. Broadcast poll in the specific session.
    //
    relatedSession.players.forEach(async (player, index) => {
      if (index != raisedPollInfo.playerVote) {
        let pollResultCollectorCard = CardFactory.adaptiveCard(PollResultCollectorCard);
        pollResultCollectorCard.content.body[0].text = `Player ${raiseGuyInfo.name} raised the poll to disclose ${selectedPlayerInfo.name} as a spy`;
        
        pollResultCollectorCard.content.actions[0].data.sessionCode = raisedPollInfo.sessionCode;
        pollResultCollectorCard.content.actions[0].data.isRightGuess = isRightGuess;
        pollResultCollectorCard.content.actions[0].data.spyIndex = raisedPollInfo.spyIdx;
        pollResultCollectorCard.content.actions[0].data.votePlayerIndex = raisedPollInfo.playerVote;

        pollResultCollectorCard.content.actions[1].data.sessionCode = raisedPollInfo.sessionCode;
        pollResultCollectorCard.content.actions[1].data.isRightGuess = isRightGuess;
        pollResultCollectorCard.content.actions[1].data.spyIndex = raisedPollInfo.spyIdx;
        pollResultCollectorCard.content.actions[1].data.votePlayerIndex = raisedPollInfo.playerVote;
        await Resolvers.proactiveMessage.notifyIndividualCard(
          player.aad,
          pollResultCollectorCard
        );
      }
    });

    return await dc.endDialog();
  }
}

module.exports = {
  SpyFallRaisePollDialog
};
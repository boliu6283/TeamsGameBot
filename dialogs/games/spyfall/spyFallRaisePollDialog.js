// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { Dialog} = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder-core');
const SpyfallDialog = require('./spyfallDialog');
const Resolvers = require('../../../resolvers');
const { pollCardId, actionCardId } = require('../../../helpers/updatableId');
const constants = require('../../../config/constants');
const PollResultCollectorCard = require('../../../static/pollResultCollectorCard.json');

// This dialog will proactively engage each user to make decision on the raised poll
// The poll result will be collected in SpyfallPollResultCollectDialog
//
let spyfallGameSessionVotingStatus = new Set();

class SpyfallRaisePollDialog extends Dialog {
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

    // 2.1 If the session has ended, we reject poll request.
    //
    if (relatedSession.status === 'complete') {
      console.log(`info: Session: ${relatedSession.code} has ended. Poll request has rejected`);
      return await dc.endDialog();
    }

    // 2.2 If the player has voted, then the player will lose the chance to raise another poll.
    //
    if (SpyfallDialog.SpyfallDialogVotedPlayerCache.has(raiseGuyInfo.aad)) {
      await Resolvers.proactiveMessage.notifyIndividual(raiseGuyInfo.aad, "Sorry... Each player has only one chance to raise the poll to against another player.");
      return await dc.endDialog();
    }

    // 2.3 If the player raises a poll, then s/he should no longer have access to the identity card.
    SpyfallDialog.SpyfallDialogVotedPlayerCache.add(raiseGuyInfo.aad)
    await Resolvers.proactiveMessage.deleteUpdatableIndividual(
      raiseGuyInfo.aad, actionCardId(relatedSession.code));

    // 3. If someone has already raised the poll to against the spy.
    //    Then we do not allow any other one to raise another poll.
    //
    if (spyfallGameSessionVotingStatus.has(relatedSession.code)) {
      console.log(`info: There is an active poll in spyfall game session: ${relatedSession.code}`);
      return await dc.endDialog();
    } else {
      spyfallGameSessionVotingStatus.add(relatedSession.code);
    }

    const trueSpyInfo = relatedSession.players[raisedPollInfo.spyIdx];
    const selectedPlayerInfo = await Resolvers.user.getUser({ aad: raisedPollInfo.selectedPersonAAD });
    const isRightGuess = selectedPlayerInfo.aad === trueSpyInfo.aad;

    // 4. Pause the countdown.
    //
    await Resolvers.countdown.pause(raisedPollInfo.sessionCode);

    // 5. Broadcast poll in the specific session.
    //
    await Promise.all(relatedSession.players.map(async (player, index) => {
      if (index != raisedPollInfo.playerVote) {
        let pollResultCollectorCard = CardFactory.adaptiveCard(PollResultCollectorCard);
        pollResultCollectorCard.content.body[0].text = `Player **${raiseGuyInfo.name}** ` +
        `raised the poll to disclose **${selectedPlayerInfo.name}** as a spy.`;
        pollResultCollectorCard.content.body[0].wrap = true;

        pollResultCollectorCard.content.actions[0].data.sessionCode = raisedPollInfo.sessionCode;
        pollResultCollectorCard.content.actions[0].data.isRightGuess = isRightGuess;
        pollResultCollectorCard.content.actions[0].data.spyIndex = raisedPollInfo.spyIdx;
        pollResultCollectorCard.content.actions[0].data.votePlayerIndex = raisedPollInfo.playerVote;

        pollResultCollectorCard.content.actions[1].data.sessionCode = raisedPollInfo.sessionCode;
        pollResultCollectorCard.content.actions[1].data.isRightGuess = isRightGuess;
        pollResultCollectorCard.content.actions[1].data.spyIndex = raisedPollInfo.spyIdx;
        pollResultCollectorCard.content.actions[1].data.votePlayerIndex = raisedPollInfo.playerVote;

        await Resolvers.proactiveMessage.notifyUpdatableIndividualCard(
          player.aad,
          pollResultCollectorCard,
          pollCardId(raisedPollInfo.sessionCode)
        );
      }
    }));

    return await dc.endDialog();
  }
}

module.exports = {
  SpyfallRaisePollDialog,
  SpyfallRaisePollDialogCache: spyfallGameSessionVotingStatus
};

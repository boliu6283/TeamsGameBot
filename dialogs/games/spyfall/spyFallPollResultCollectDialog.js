// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { Dialog } = require('botbuilder-dialogs');
const Resolvers = require('../../../resolvers');
const { spyfallEndGamehelper } = require('../../../helpers/games/spyfall');
const { pollCardId, pollWaitingId } = require('../../../helpers/updatableId');
const constants = require('../../../config/constants');
const SpyfallRaisePollDialogCache = require('./spyfallRaisePollDialog');

// The poll result will be collected in this dialog.
// A global dictionary will be cached to determine whether a poll is ended.
//
let sessionVoteResultMap = new Map();

class SpyfallPollResultCollectDialog extends Dialog {
  constructor(luisRecognizer) {
    super(constants.SPYFALL_POLL_RESULT_COLLECT_DIALOG);

    this._luisRecognizer = luisRecognizer;
  }

  async beginDialog(dc, options) {
    const pollResultInfo = dc.context.activity.value;
    const sessionCode = pollResultInfo.sessionCode;
    const session = await Resolvers.gameSession.getSession({ code: sessionCode });
    const spyfallPollSelectedResult = pollResultInfo.spyfallPollSelectedResult;
    session.players.push(session.host);
    const raisedPollPlayer = session.players[pollResultInfo.votePlayerIndex];
    const spyInfo = session.players[pollResultInfo.spyIndex];

    // 1. Once we catched call here, we push the value into the map.
    //
    let pollResult = null;
    if (sessionVoteResultMap.has(sessionCode)) {
      pollResult = sessionVoteResultMap.get(sessionCode);
    } else {
      pollResult = {
        votedPlayersCount: 1,
        agreedCount: 1,
        totalPlayers: session.players.length,
        isRightGuess: pollResultInfo.isRightGuess
      };
    }

    pollResult.votedPlayersCount += 1
    if (spyfallPollSelectedResult === 'Agree') {
      pollResult.agreedCount += 1;
    }

    sessionVoteResultMap.set(sessionCode, pollResult);

    // 2. If we have collected all responses from every player in the specific session,
    //    we can display the poll result.
    //
    if (pollResult.votedPlayersCount === pollResult.totalPlayers) {
      const isRightGuess = pollResult.isRightGuess;
      const isPollPassed = pollResult.agreedCount > pollResult.totalPlayers / 2;
      if (isPollPassed) {
        await Resolvers.countdown.kill(pollResultInfo.sessionCode);

        await spyfallEndGamehelper({
          code: sessionCode,
          res: isRightGuess ? 'voteCorrect' : 'voteWrong',
          spyIdx: pollResultInfo.spyIndex,
          voterIdx: pollResultInfo.votePlayerIndex
        });
      } else {
        // The poll is not passed. Resume the countdown.
        //
        await Resolvers.countdown.resume(pollResultInfo.sessionCode);

        // Notify session, the game is not ended.
        //
        await Resolvers.proactiveMessage.notifySession(
          pollResultInfo.sessionCode,
          `**Spyfall ${sessionCode}. Poll not pass. Resume countdown!**`
        );
      }

      // Whenever a poll is done. We should clean it from the map.
      // Besides, we need to clean the cache in the SpyFallRaisePollDialog.
      // Otherwise, it may block the further poll request and clean up all updatable session.
      //
      sessionVoteResultMap.delete(sessionCode);
      await Resolvers.proactiveMessage.deleteUpdatableSession(
        sessionCode, pollWaitingId(sessionCode));

      // Sanity check
      // DEVNOTE: However, if SpyfallRaisePollDialogCache does not have the value for
      // this sessionCode. It must be a bug, though it is transient error.
      //
      if (SpyfallRaisePollDialogCache.SpyfallRaisePollDialogCache.has(sessionCode)) {
        SpyfallRaisePollDialogCache.SpyfallRaisePollDialogCache.delete(sessionCode);
      } else {
        console.log(`WARNING: ${sessionCode} was not inserted into the SpyfallRaisePollDialogCache!`);
      }
    }

    // Handle a situation where the other player is still voting
    if (pollResult.votedPlayersCount < pollResult.totalPlayers) {
      await Resolvers.proactiveMessage.deleteUpdatableIndividual(
        options.user.aad, pollCardId(sessionCode));

      const remainingVoter = pollResult.totalPlayers - pollResult.votedPlayersCount;
      await Resolvers.proactiveMessage.notifyUpdatableSession(
        sessionCode,
        `Waiting for ${remainingVoter} players to vote`,
        pollWaitingId(sessionCode));
    }

    return await dc.endDialog();
  }
}

module.exports = {
  SpyfallPollResultCollectDialog
};

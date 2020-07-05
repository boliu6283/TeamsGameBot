const { Dialog } = require('botbuilder-dialogs');
const Resolvers = require('../../../resolvers');
const constants = require('../../../config/constants');

// The poll result will be collected in this dialog.
// A global dictionary will be cached to determine whether a poll is ended.
//
let sessionVoteResultMap = new Map();

class SpyFallPollResultCollectDialog extends Dialog {
  constructor(luisRecognizer) {
    super(constants.SPYFALL_POLL_RESULT_COLLECT_DIALOG);

    this._luisRecognizer = luisRecognizer;
  }

  async beginDialog(dc, options) {
    const pollResultInfo = dc.context.activity.value;
    const sessionCode = pollResultInfo.sessionCode;
    const session = await Resolvers.gameSession.getSession({ code: sessionCode });
    const spyfallPollSelectedResult = pollResultInfo.spyfallPollSelectedResult;

    // 1. Once we catched call here, we push the value into the map.
    //
    let pollResult = null;
    if (sessionVoteResultMap.has(sessionCode)) {
      pollResult = sessionVoteResultMap.get(sessionCode);
    } else {
      // The person who raised the poll will be counted as 'Agree'.
      //
      pollResult = { 
        votedPlayersCount: 1,
        agreedCount: 1,
        totalPlayers: session.players.length,
        isRightGuess: pollResultInfo.isRightGuess
      };
    }
    
    pollResult.votedPlayersCount += 1
    if (spyfallPollSelectedResult === true) {
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
        if (isRightGuess) {
          // This is a good guess. End the game.
          //
          await Resolvers.countdown.kill(pollResultInfo.sessionCode);
          await Resolvers.proactiveMessage.notifySession(
            pollResultInfo.sessionCode,
            `Spyfall ${sessionCode} is now finished, players win`
          );
        } else {
          // This is a bad guess. Spy win the game.
          //
          await Resolvers.countdown.kill(pollResultInfo.sessionCode);
          await Resolvers.proactiveMessage.notifySession(
            pollResultInfo.sessionCode,
            `Spyfall ${sessionCode} is now finished, spy win`
          );
        }
      } else {
        // The poll is not passed. Resume the countdown.
        //
        await Resolvers.countdown.resume({ sessionCode: pollResultInfo.sessionCode });

        // Notify session, the game is not ended.
        //
        await Resolvers.proactiveMessage.notifySession(
          pollResultInfo.sessionCode,
          `Spyfall ${sessionCode}. Poll not pass. Resume countdown`
        );
      }

      // Whenever a poll is done. We should clean it from the map.
      //
      sessionVoteResultMap.delete(sessionCode);
    }

    return await dc.endDialog();
  }
}

module.exports = {
  SpyFallPollResultCollectDialog
};

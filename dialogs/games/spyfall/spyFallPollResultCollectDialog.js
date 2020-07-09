const { Dialog } = require('botbuilder-dialogs');
const Resolvers = require('../../../resolvers');
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
        if (isRightGuess) {
          // This is a good guess. End the game.
          //
          await Resolvers.countdown.resume(pollResultInfo.sessionCode);
          await Resolvers.countdown.kill(pollResultInfo.sessionCode);
          await Resolvers.proactiveMessage.notifySession(
            pollResultInfo.sessionCode,
            `Spyfall ${sessionCode} is now finished, players win`
          );

          // Update player's scores.
          //
          session.players.forEach(async (player, index) => {
            if (index === pollResultInfo.votePlayerIndex) {
              await Resolvers.user.updateUserScore({aad: player.aad, earnedScore: 10});
            } else if (index !== pollResultInfo.spyIndex) {
              await Resolvers.user.updateUserScore({aad: player.aad, earnedScore: 5});
            }
          });
        } else {
          // This is a bad guess. Spy win the game.
          //
          await Resolvers.countdown.resume(pollResultInfo.sessionCode);
          await Resolvers.countdown.kill(pollResultInfo.sessionCode);
          await Resolvers.proactiveMessage.notifySession(
            pollResultInfo.sessionCode,
            `Spyfall ${sessionCode} is now finished, spy wins`
          );

          // Update spy's score.
          //
          await Resolvers.user.updateUserScore({aad: spyInfo.aad, earnedScore: 20});
        }
      } else {
        // The poll is not passed. Resume the countdown.
        //
        await Resolvers.countdown.resume(pollResultInfo.sessionCode);

        // Notify session, the game is not ended.
        //
        await Resolvers.proactiveMessage.notifySession(
          pollResultInfo.sessionCode,
          `Spyfall ${sessionCode}. Poll not pass. Resume countdown`
        );
      }

      // Whenever a poll is done. We should clean it from the map.
      // Besides, we need to clean the cache in the SpyFallRaisePollDialog.
      // Otherwise, it may block the further poll request. 
      //
      sessionVoteResultMap.delete(sessionCode);
      
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

    return await dc.endDialog();
  }
}

module.exports = {
  SpyfallPollResultCollectDialog
};

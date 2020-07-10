const { CardFactory } = require('botbuilder-core');
const Resolvers = require('../../resolvers/index');
const { gameScorePics } = require('../../config/pics')
const GameScoreCard = require('../../static/gameScoreCard.json');
const SpyfallEndCard = require('../../static/spyfallEndCard.json');

const spyfallEndGamehelper = async (args) => {
  const { code, res, spyIdx, voterIdx } = args;
  let displayText;
  const session = await Resolvers.gameSession.getSession({ code });
  session.players.push(session.host);
  
  // update scores
  switch(res) {
    case 'guessCorrect' || 'voteWrong': {
      displayText = 'Spy wins!!!'
      await Resolvers.user.updateUserScore({
        aad: session.players[spyIdx].aad,
        earnedScore: 40
      });

      break;
    }

    case 'guessWrong': {
      displayText = 'Players win!!!'
      session.players.forEach(async (player, index) => {
        if (index !== spyIdx) {
          await Resolvers.user.updateUserScore({
            aad: player.aad,
            earnedScore: 10
          });
        }
      });

      break;
    }

    case 'voteCorrect': {
      displayText = 'Players win!!!'
      session.players.forEach(async (player, index) => {
        if (index === voterIdx) {
          await Resolvers.user.updateUserScore({
            aad: player.aad,
            earnedScore: 20
          });
        } else if (index !== spyIdx) {
          await Resolvers.user.updateUserScore({
            aad: player.aad,
            earnedScore: 10
          });
        }
      });
      break;
    }

    case 'timeout': {
      displayText = 'Spy wins!!!'
      await Resolvers.user.updateUserScore({
        aad: session.players[spyIdx].aad,
        earnedScore: 20
      });

      break;
    }

  }

  // Clean up GameScoreCard
  GameScoreCard.body[2].items[0].columns[0].items = [];
  GameScoreCard.body[2].items[0].columns[1].items = [];
  GameScoreCard.body[2].items[0].columns[2].items = [];
  GameScoreCard.body[2].items[0].columns[3].items = [];

  const gameScoreCard = CardFactory.adaptiveCard(GameScoreCard);
  gameScoreCard.content.body[0].text = displayText;
  gameScoreCard.content.body[1].url = gameScorePics[0];

  const newSession = await Resolvers.gameSession.getSession({ code }); 
  // ask:: why a new session?
  newSession.players.push(newSession.host);
  newSession.players.forEach((player, index) => {
    let roleIcon;
    if (index === spyIdx) {
      roleIcon = '😈';
    } else if (index === voterIdx) {
      roleIcon = '🕵️‍♂️';
    } else {
      roleIcon = '👨'
    }
    gameScoreCard.content.body[2].items[0].columns[0].items.push({
      type: 'TextBlock',
      text: roleIcon,
      horizontalAlignment: 'center',
      weight: 'Bolder'
    });
    gameScoreCard.content.body[2].items[0].columns[1].items.push({
      type: 'TextBlock',
      text: player.name,
      horizontalAlignment: 'center',
      weight: 'Bolder'
    });
    const earn = player.score - session.players[index].score;
    gameScoreCard.content.body[2].items[0].columns[2].items.push({
      type: 'TextBlock',
      text: `+${earn.toString()}`,
      horizontalAlignment: 'center',
      weight: 'Bolder'
    });
    gameScoreCard.content.body[2].items[0].columns[3].items.push({
      type: 'TextBlock',
      text: player.score.toString(),
      horizontalAlignment: 'center',
      weight: 'Bolder'
    });
  });

  // notify session
  newSession.players.forEach(player => {
    Resolvers.proactiveMessage.notifyIndividualCard(player.aad, gameScoreCard);
  });

  const card = CardFactory.adaptiveCard(SpyfallEndCard);
  card.content.actions[0].data.sessionCode = code;
  card.content.actions[1].data.sessionCode = code;

  session.status = 'complete';
  return await Resolvers.proactiveMessage.notifyIndividualCard(session.host.aad, card);
}

module.exports = {
  spyfallEndGamehelper
};

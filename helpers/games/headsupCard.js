const { CardFactory } = require('botbuilder-core');
const { gameScorePics } = require('../../config/pics')
const HeadsupCard = require('../../static/headsupCard.json');
const GameScoreCard = require('../../static/gameScoreCard.json');

const getHeadsupCard = (sessionCode, currentPlayer, otherPlayerAssignedWords) => {
  // Deep copy of this .json file, Object.assign or {...dict} doesn't work
  const card = JSON.parse(JSON.stringify(HeadsupCard));

  // { player: player, word: word }
  Object.values(otherPlayerAssignedWords).forEach(item => {
    card.body[1].columns[0].items.push({
      "type": "TextBlock",
      "text": item.player.name,
      "horizontalAlignment": "center"
    });
    card.body[1].columns[1].items.push({
      "type": "TextBlock",
      "text": item.word,
      "horizontalAlignment": "center"
    });
  });

  card.actions[0].data.headsupLoserAad = currentPlayer.aad;
  card.actions[0].data.sessionCode = sessionCode
  return card;
}

const getHeadsupScoreCard = (title, allPlayers, scoreEarned, loserAad) => {
  // If a game does not have loser (loserAad === undefined), that means it is timeout
  const hasLoser = !!loserAad;

  // Deep copy of this .json file, Object.assign or {...dict} doesn't work
  const card = JSON.parse(JSON.stringify(GameScoreCard));

  // Clean up GameScoreCard
  card.body[0].text = title;
  card.body[1].url = gameScorePics[0];

  allPlayers.forEach(player => {
    const isLoser = player.aad === loserAad;
    const roleIcon = hasLoser ? (isLoser ? '😭' : '🤣') : '😐';
    const scoreIncrement = hasLoser ? (isLoser ? 0 : scoreEarned) : scoreEarned;

    card.body[2].items[0].columns[0].items.push({
      type: 'TextBlock',
      text: roleIcon,
      horizontalAlignment: 'center',
      weight: 'Bolder'
    });
    card.body[2].items[0].columns[1].items.push({
      type: 'TextBlock',
      text: player.name,
      horizontalAlignment: 'center',
      weight: 'Bolder'
    });
    card.body[2].items[0].columns[2].items.push({
      type: 'TextBlock',
      text: scoreIncrement.toString(),
      horizontalAlignment: 'center',
      weight: 'Bolder'
    });
    card.body[2].items[0].columns[3].items.push({
      type: 'TextBlock',
      text: `${player.score} => ${player.score + scoreIncrement}`,
      horizontalAlignment: 'center',
      weight: 'Bolder'
    });
  });

  return card;
};

module.exports = {
  getHeadsupCard,
  getHeadsupScoreCard
}

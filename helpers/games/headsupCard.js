const HeadsupCard = require('../../static/headsupCard.json');

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

module.exports = {
  getHeadsupCard
}

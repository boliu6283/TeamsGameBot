const { CardFactory } = require('botbuilder-core');
const { getHeadsupScoreCard } = require('../games/headsupCard');
const constants = require('../../config/constants');
const Resolvers = require('../../resolvers');
const EndgameCard = require('../../static/endgameCard.json');
const GameScoreCard = require('../../static/gameScoreCard.json');

const headsupEndgameHelper = async (args) => {
  const { sessionCode, reason, loserAad } = args;
  const session = await Resolvers.gameSession.getSession({ code: sessionCode });

  if (!session) {
    throw Error(`Session ${session} cannot be found`);
  }

  // Send out Endgame Proactive Messages
  switch (reason) {
    case 'admitted':
      await creditEndgameScores(session, loserAad);
      await sendEndgameScoreCards(session, loserAad);
      break;
    case 'timeout':
      await creditTimeoutScores(session);
      await sendTimeoutScoreCards(session);
      break;
    default:
      throw Error(`Unknown headsup endgame reason ${reason}`);
  }

  // Endgame session
  await Resolvers.gameSession.endSession({ code: session.code });

  // Clean up resources
  Resolvers.countdown.kill(session.code);

  // Send out restart card
  await sendRestartCard(session);
}

const creditEndgameScores = async (session, loserAad) => {
  const allPlayers = [...session.players];
  allPlayers.push(session.host);

  allPlayers.filter(player => player.aad !== loserAad)
    .forEach(async (player) => {
      await Resolvers.user.updateUserScore({
        aad: player.aad,
        earnedScore: constants.HEADSUP_ENDGAME_SCORE_INCREMENT
      });
    });
}

const creditTimeoutScores = async (session) => {
  const allPlayers = [...session.players];
  allPlayers.push(session.host);

  allPlayers.forEach(async (player) => {
    await Resolvers.user.updateUserScore({
      aad: player.aad,
      earnedScore: constants.HEADSUP_TIMEOUT_SCORE_INCREMENT
    });
  });
}

const sendEndgameScoreCards = async (session, loserAad) => {
  const allPlayers = [...session.players];
  allPlayers.push(session.host);
  const loserName = allPlayers.find(p => p.aad === loserAad).name;
  const card = getHeadsupScoreCard(`Player **${loserName}** admitted saying the forbidden word.`,
    allPlayers,
    constants.HEADSUP_ENDGAME_SCORE_INCREMENT,
    loserAad);
  const adaptiveCard = CardFactory.adaptiveCard(card);

  await Resolvers.proactiveMessage.notifySessionCard(session.code, adaptiveCard);
}

const sendTimeoutScoreCards = async (session) => {
  const allPlayers = [...session.players];
  allPlayers.push(session.host);
  const card = getHeadsupScoreCard(`No one says any forbidden words. Great work everyone!`,
    allPlayers,
    constants.HEADSUP_TIMEOUT_SCORE_INCREMENT);
  const adaptiveCard = CardFactory.adaptiveCard(card);

  await Resolvers.proactiveMessage.notifySessionCard(session.code, adaptiveCard);
}

const sendRestartCard = async (session) => {
  const card = CardFactory.adaptiveCard(EndgameCard);
  card.content.actions[0].data.sessionCode = session.code;
  card.content.actions[1].data.sessionCode = session.code;
  card.content.actions[1].data.recreateSession = 'headsup';

  return await Resolvers.proactiveMessage.notifyIndividualCard(session.host.aad, card);
}

module.exports = {
  headsupEndgameHelper
}

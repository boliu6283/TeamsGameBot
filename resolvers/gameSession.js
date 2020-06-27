const GameSession = require('../models/gameSession');

const getSession = async (args) => {
  return await GameSession.findOne({ 
    code: args.code 
  }).populate({
    path: 'game host'
  });
}

const createSession = async (args) => {
  const { code, game, host, players, audiences } = args;
  const newGameSession = new GameSession({
    code,
    game,
    host,
    players,
    audiences
  });

  const gameSession = await newGameSession.save();
  if (!gameSession) throw new Error ('Failed to save new record in GameSession collection');
  console.log(`${gameSession._id} added to GameSession collection successfully`);

  return gameSession.code;
}

const deleteSession = async (args) => {
  return await findOneAndDelete({ code: args.code });
}

module.exports = {
  getSession,
  createSession,
  deleteSession
};

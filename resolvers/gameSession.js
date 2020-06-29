const GameSession = require('../models/gameSession');

const getSession = async (args) => {
  return await GameSession.findOne({
    code: args.code
  }).populate({
    path: 'game host players'
  });
}

const addPlayerToSession = async (args) => {
  const { code, userId } = args;
  await GameSession.findOneAndUpdate({
    code
  }, {
    $addToSet: {
      players: userId
    }
  });
}

const createSession = async (args) => {
  const { code, game, host } = args;
  const newGameSession = new GameSession({
    code,
    game,
    host
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
  addPlayerToSession,
  createSession,
  deleteSession
};

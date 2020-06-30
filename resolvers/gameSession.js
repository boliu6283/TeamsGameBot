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
  const currentTime = new Date();
  const newGameSession = new GameSession({
    code,
    game,
    host,
    status: 'await',
    createdAt: currentTime
  });

  const gameSession = await newGameSession.save();
  if (!gameSession) throw new Error ('Failed to save new record in GameSession collection');
  console.log(`${gameSession._id} added to GameSession collection successfully`);

  return gameSession.code;
}

const deleteSession = async (args) => {
  return await findOneAndDelete({ code: args.code });
}

const startSession = async (args) => {
  const { code, lifespanSec } = args;
  const currentTime = new Date();

  let expectedEndTime = null;
  // Set session expected end time if lifespan is set
  if (lifespanSec) {
    expectedEndTime = new Date(currentTime.getTime() + lifespanSec * 1000);
  }

  return await GameSession.findOneAndUpdate({
    code
  }, {
    status: 'start',
    updatedAt: currentTime,
    startedAt: currentTime,
    expectedToEndAt: expectedEndTime
  });
}

const endSession = async (args) => {
  const { code } = args;
  const currentTime = new Date();
  return await GameSession.findOneAndUpdate({
    code
  }, {
    status: 'complete',
    completedAt: currentTime
  });
}

module.exports = {
  getSession,
  addPlayerToSession,
  createSession,
  deleteSession,
  startSession,
  endSession
};

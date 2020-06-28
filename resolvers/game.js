const Game = require('../models/game');
const game = require('../models/game');

const getAllGames = async () => {
  return await Game.find({}, 'name description capacity profile');
}

const getGameByName = async (args) => {
  const { gameName } = args;
  const gameInfo = await Game.findOne({ name: gameName });
  if (!gameInfo) throw new Error (`Failed to find game: ${gameName}`);

  return gameInfo;
}

const createGame = async (args) => {
  const { name, description, capacity, price, profile } = args;
  const newGame = new Game({
    name,
    description,
    capacity,
    price,
    profile
  });

  const game = await newGame.save();
  if (!game) throw new Error ('Failed to save new record in Game collection');
  console.log(`${game._id} added to Game collection successfully`);

  return game.name;
}

module.exports = {
  getAllGames,
  createGame,
  getGameByName
};

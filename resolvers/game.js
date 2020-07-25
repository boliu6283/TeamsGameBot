const Game = require('../models/game');

const getAllGames = async () => {
  return await Game.find({}, 'name description capacity profile');
}

const getGameById = async (args) => {
  const gameInfo = await Game.findById(args._id);
  if (!gameInfo) throw new Error ('Failed to find game in Game collection');

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

const getGameMetadata = async (args) => {
  return (await getGameById({ _id: args._id })).metadata;
}

module.exports = {
  getAllGames,
  createGame,
  getGameById,
  getGameMetadata
};

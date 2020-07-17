const Game = require('../models/game');

const getAllGames = async () => {
  return await Game.find({}, 'name description capacity profile');
}

const getGameById = async (args) => {
  const gameInfo = await Game.findById(args._id);
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

const getSpyfallMetadata = async () => {
  return (await getGameById({ _id: '5ef2cda211846b2ac0225533' })).metadata;
}

const getHeadsupMetadata = async () => {
  return (await getGameById({ _id: '5ef2ce5810018e475c941ce1' })).metadata;
}

module.exports = {
  getAllGames,
  createGame,
  getGameById,
  getSpyfallMetadata,
  getHeadsupMetadata
};

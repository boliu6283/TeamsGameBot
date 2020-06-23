const Game = require('../models/game');

const getAllGames = async () => {
  return await Game.find({}, 'name description capacity');
}

const createGame = async (args) => {
  const { name, description, capacity, price } = args;
  const newGame = new Game({
    name,
    description,
    capacity,
    price
  });

  const game = await newGame.save();
  if (!game) throw new Error ('Failed to save new record in Game collection');
  console.log(`${game._id} added to Game collection successfully`);

  return game.name;
}

module.exports = {
  getAllGames,
  createGame
};

const getRandomPic = type => type[Math.floor(Math.random()*type.length)];
const getRandomInt = max => Math.floor(Math.random() * Math.floor(max));

module.exports = {
  getRandomPic,
  getRandomInt
};

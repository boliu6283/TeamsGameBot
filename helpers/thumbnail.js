const getRandomPic = type => type[Math.floor(Math.random()*type.length)];
const getRandomInt = max => Math.floor(Math.random() * Math.floor(max));
const printTime = (string, pad, length) => (new Array(length+1).join(pad) + string).slice(-length);

module.exports = {
  getRandomPic,
  getRandomInt,
  printTime
};

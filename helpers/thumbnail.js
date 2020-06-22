const getRandomPic = type => type[Math.floor(Math.random()*type.length)];

const menuPics = [
  'https://gamebot.blob.core.windows.net/menu-pic/cat_1.jpg',
  'https://gamebot.blob.core.windows.net/menu-pic/cat_2.jpg'
];

module.exports = {
  getRandomPic,
  menuPics
};

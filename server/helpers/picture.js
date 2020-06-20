const menuPics = [
  'https://gamebot.blob.core.windows.net/menu-pic/cat_1.jpg',
  'https://gamebot.blob.core.windows.net/menu-pic/cat_2.jpg'
];

function getRandomPic(type) {
  return type[Math.floor(Math.random()*type.length)];
}

const menuPic = getRandomPic(menuPics);

module.exports = {
  menuPic
}

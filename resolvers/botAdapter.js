const { BotFrameworkAdapter } = require('botbuilder');

let _adapterInstance = null;

const getInstance = (appId, appPassword) => {
  if (!_adapterInstance) {
    _adapterInstance = new BotFrameworkAdapter({
      appId,
      appPassword,
    });
  };
  return _adapterInstance;
}

module.exports = {
  getInstance
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
};

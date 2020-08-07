// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const SpyfallCard = require('../../static/spyfallCard.json');
const SpyActionCard = require('../../static/spyfallSpyActionCard.json');
const DetectiveActionCard = require('../../static/spyfallDetectiveActionCard.json');
const GameScoreCard = require('../../static/gameScoreCard.json');


const getIdentityCard = (spyfallRoles) => {
  // Deep copy of this .json file, Object.assign or {...dict} doesn't work
  const specializedCard = JSON.parse(JSON.stringify(SpyfallCard));

  for (let i = 0; i < spyfallRoles.locations.length; i++) {
    const locationItem = {
      type: 'TextBlock',
      text: spyfallRoles[`location.${spyfallRoles.locations[i]}`]
    };
    specializedCard.body[1].columns[i % 3].items.push(locationItem);
  }

  return specializedCard;
}

const getSpyActionCard = () => {
  return JSON.parse(JSON.stringify(SpyActionCard));
}

const getDetectiveActionCard = () => {
  return JSON.parse(JSON.stringify(DetectiveActionCard));
}

const getGameScoreCard = () => {
  return JSON.parse(JSON.stringify(GameScoreCard));
}

module.exports = {
  getIdentityCard,
  getSpyActionCard,
  getDetectiveActionCard,
  getGameScoreCard
}

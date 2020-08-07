// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const mongoose = require('mongoose');
const { Schema } = mongoose;
const constants = require('../config/constants');

const gameSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  rules: { type: String, default: '' },
  rulesUrl: { type: String, default: constants.DOMAIN },
  capacity: [{ type: Number }],
  price: { type: Number, default: 0 },
  profile: { type: String },
  pictures: [{ type: String }],
  metadata: { type: Object },
  createdAt: { type: Date },
  updatedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Game', gameSchema);

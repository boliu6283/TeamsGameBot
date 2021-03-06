// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  aad: { type: String, required: true },
  email: { type: String },
  name: { type: String, required: true },
  givenName: { type: String, required: true },
  role: { type: String, default: 'User' },
  status: { type: String, default: 'offline' },
  score: { type: Number, default: 10 },
  credit: { type: Number, default: 0.0 },
  description: { type: String, default: '' },
  subscription: { type: Boolean, default: true },
  gamePurchase: { type: Schema.Types.ObjectId, ref: 'gamePurchase' },
  createdAt: { type: Date },
  updatedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);

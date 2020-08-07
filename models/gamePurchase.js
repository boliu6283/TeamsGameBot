// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const mongoose = require('mongoose');
const { Schema } = mongoose;

const gamePurchase = new mongoose.Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  transactionId: { type: String },
  createdAt: { type: Date }
}, {
  timestamps: true
});

export default mongoose.model('GamePurchase', gamePurchase);

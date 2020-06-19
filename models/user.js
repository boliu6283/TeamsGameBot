const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  aad: { type: String, required: true },
  email: { type: String },
  name: { type: String, required: true },
  status: { type: String, default: 'offline' },
  score: { type: Number, default: 10 },
  description: { type: String, default: '' },
  gamePurchase: { type: Schema.Types.ObjectId, ref: 'gamePurchase' },
  createdAt: { type: Date },
  updatedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);

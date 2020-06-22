const mongoose = require('mongoose');
const { Schema } = mongoose;

const gameSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
  createdAt: { type: Date },
  updatedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Game', gameSchema);

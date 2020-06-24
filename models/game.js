const mongoose = require('mongoose');
const { Schema } = mongoose;

const gameSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  capacity: [{ type: Number }],
  price: { type: Number, default: 0 },
  profile: { type: String },
  pictures: [{ type: String }],
  createdAt: { type: Date },
  updatedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Game', gameSchema);

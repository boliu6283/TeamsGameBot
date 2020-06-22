const mongoose = require('mongoose');
const { Schema } = mongoose;

const gameSessionSchema = new Schema({
  code: { type: String, required: true },
  game: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date },
  updatedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('GameSessionSchema', gameSessionSchema);

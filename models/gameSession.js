const mongoose = require('mongoose');
const { Schema } = mongoose;

const gameSessionSchema = new Schema({
  code: { type: String, required: true },
  game: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  status: { type: String, default: 'await', enum:['await', 'start', 'complete'] },
  url: { type: String },
  host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  players: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  audiences: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date },
  updatedAt: { type: Date },
  startedAt: { type: Date },
  expectedToEndAt: { type: Date },
  completedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('GameSession', gameSessionSchema);

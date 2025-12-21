const mongoose = require('mongoose');

const GameSessionSchema = new mongoose.Schema({
  roomId: String,
  round: Number,
  drawerId: String,
  word: String,
  hintState: String,
  guessedPlayers: [String],
  startedAt: Date,
  endedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('GameSession', GameSessionSchema);

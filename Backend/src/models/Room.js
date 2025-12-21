const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  userId: String,
  name: String,
  socketId: String,
  score: { type: Number, default: 0 },
  hasGuessed: { type: Boolean, default: false }
});

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, unique: true },
  hostId: String,
  players: [PlayerSchema],
  status: { type: String, enum: ['waiting','playing','finished'], default: 'waiting'},
  currentTurnIndex: { type: Number, default: 0 },
  maxPlayers: { type: Number, default: 4 },
  roundsPerPlayer: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);

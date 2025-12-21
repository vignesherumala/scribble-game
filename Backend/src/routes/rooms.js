const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');

// create room
router.post('/create', async (req, res) => {
  try {
    const roomId = uuidv4().slice(0,8).toUpperCase();
    const { name } = req.body;
    const room = new Room({
      roomId,
      hostId: req.body.userId || roomId,
      players: [{ userId: req.body.userId || roomId, name: name || 'Host', socketId: '' }]
    });
    await room.save();
    res.json({ ok: true, room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok:false, error: err.message });
  }
});

// join room by id
router.post('/join/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, name } = req.body;
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ ok:false, error: 'Room not found' });
    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({ ok:false, error: 'Room full' });
    }
    room.players.push({ userId, name, socketId: ''});
    await room.save();
    res.json({ ok:true, room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok:false, error: err.message });
  }
});

module.exports = router;

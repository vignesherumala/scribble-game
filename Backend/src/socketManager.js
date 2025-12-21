const Room = require('./models/Room');
const GameSession = require('./models/GameSession');
const words = require('./utils/words');
const { initHint, revealNext } = require('./utils/hint');

module.exports = (io) => {
  io.on('connection', socket => {
    console.log('socket connected', socket.id);

    // when client joins a room (after hitting join api)
    socket.on('join-room', async ({ roomId, userId, name }) => {
      socket.join(roomId);
      console.log(`${name} joined ${roomId}`);
      // update socket id in DB
      const room = await Room.findOne({ roomId });
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      const player = room.players.find(p => p.userId === userId) || room.players.find(p => !p.socketId);
      if (player) {
        player.socketId = socket.id;
        player.userId = userId;
        player.name = name;
      } else {
        // if not found, add if space
        if (room.players.length < room.maxPlayers) {
          room.players.push({ userId, name, socketId: socket.id });
        } else {
          socket.emit('room-full');
          return;
        }
      }
      await room.save();
      io.to(roomId).emit('player-list', room.players.map(p => ({ name: p.name, score: p.score, userId: p.userId })));
    });

    socket.on('start-game', async ({ roomId }) => {
      const room = await Room.findOne({ roomId });
      if (!room) return;
      room.status = 'playing';
      room.currentTurnIndex = 0;
      await room.save();

      // start first round
      startRound(io, room);
    });

    socket.on('stroke', ({ roomId, stroke }) => {
      // broadcast stroke to everyone except sender
      socket.to(roomId).emit('draw-data', stroke);
    });

    socket.on('guess', async ({ roomId, userId, guess }) => {
      const room = await Room.findOne({ roomId });
      if (!room) return;
      const session = await GameSession.findOne({ roomId }).sort({ createdAt: -1 });

      if (!session || session.endedAt) {
        // no active session
        io.to(socket.id).emit('message', { system: true, text: 'No active round' });
        return;
      }
      const word = session.word.toLowerCase().trim();
      if (guess.toLowerCase().trim() === word) {
        // if not guessed already by this user
        if (!session.guessedPlayers.includes(userId)) {
          session.guessedPlayers.push(userId);
          await session.save();

          // award points: +1 to guesser and +1 to drawer
          const drawerId = session.drawerId;
          const guesser = room.players.find(p => p.userId === userId);
          const drawer = room.players.find(p => p.userId === drawerId);
          if (guesser) guesser.score += 1;
          if (drawer) drawer.score += 1;
          await room.save();

          io.to(roomId).emit('correct-guess', { userId, name: guesser?.name, word: session.word });
          io.to(roomId).emit('score-update', room.players.map(p => ({ userId: p.userId, score: p.score })));

          // If all other players guessed (3 players or players.length-1) end round
          const totalPlayers = room.players.length;
          const requiredGuesses = totalPlayers - 1; // everyone but drawer
          if (session.guessedPlayers.length >= requiredGuesses) {
            // end round early
            await endRound(io, room, session);
          }
        }
      } else {
        // broadcast chat as normal
        io.to(roomId).emit('chat', { userId, text: guess });
      }
    });

    socket.on('hint-request', async ({ roomId, userId }) => {
      // reveal next char in hint state
      const session = await GameSession.findOne({ roomId }).sort({ createdAt: -1 });
      if (!session || session.endedAt) return;
      session.hintState = revealNext(session.hintState, session.word);
      await session.save();
      // broadcast new hint to guessers (all clients). Drawer will still know full word because server does not change that.
      io.to(roomId).emit('hint-update', { hint: session.hintState });
    });

    socket.on('next-turn', async ({ roomId }) => {
      const room = await Room.findOne({ roomId });
      if (!room) return;
      room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
      await room.save();
      startRound(io, room);
    });

    socket.on('disconnect', async () => {
      console.log('socket disconnect', socket.id);
      // optional: update DB to remove socketId, or set player offline flag
      try {
        const room = await Room.findOne({ 'players.socketId': socket.id });
        if (room) {
          const p = room.players.find(pl => pl.socketId === socket.id);
          if (p) p.socketId = '';
          await room.save();
          io.to(room.roomId).emit('player-list', room.players.map(p => ({ name: p.name, score: p.score, userId: p.userId })));
        }
      } catch (err) {
        console.error('disconnect handling error', err);
      }
    });
  }); // io.on connection

  // helper functions
  async function startRound(io, room) {
    // pick drawer based on currentTurnIndex
    const drawer = room.players[room.currentTurnIndex];
    const chosen = words[Math.floor(Math.random()*words.length)];
    const session = new GameSession({
      roomId: room.roomId,
      round: 1,
      drawerId: drawer.userId,
      word: chosen,
      hintState: initHint(chosen),
      guessedPlayers: [],
      startedAt: new Date()
    });
    await session.save();

    // notify drawer with the secret word via socket (private)
    if (drawer.socketId) {
      io.to(drawer.socketId).emit('round-start', { role: 'drawer', word: chosen, roundId: session._id });
    }
    // notify others about round start and blanks
    io.to(room.roomId).emit('round-start', { role: 'guesser', hint: session.hintState, drawer: { userId: drawer.userId, name: drawer.name } });

    // start timer (example 60s)
    setTimeout(async () => {
      const active = await GameSession.findById(session._id);
      if (active && !active.endedAt) {
        await endRound(io, room, active);
      }
    }, 60 * 1000);
  }

  async function endRound(io, room, session) {
    session.endedAt = new Date();
    await session.save();
    io.to(room.roomId).emit('round-end', { word: session.word, guessedPlayers: session.guessedPlayers });
    // after a short delay, rotate turn
    room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
    await room.save();
    // maybe start next round automatically after a delay
    setTimeout(()=> startRound(io, room), 3000);
  }
};

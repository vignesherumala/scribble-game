import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

const PORT = 5000;

/* ---------------- GAME STATE ---------------- */

const rooms = {};
const words = ["apple", "car", "dog", "house", "tree", "airplane",  "microscope",
  "skyscraper",  "astronaut",  "waterfall",  "basketball",  "helicopter",  "chameleon",  "snowflake",  "volcano",  "lightning",  "submarine",  "pineapple",  "sandcastle",  "hourglass",  "rainbow",  "telescope",  "windmill",  "keyboard",  "headphones",];
const MAX_ROUNDS = 5;

function getWord() {
  return words[Math.floor(Math.random() * words.length)];
}

/* ---------------- TIMER HANDLER ---------------- */

function startTimer(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  if (room.timer) clearInterval(room.timer);

  let time = 60;
  io.to(roomId).emit("timerUpdate", time);

  room.timer = setInterval(() => {
    time--;
    io.to(roomId).emit("timerUpdate", time);

    if (time <= 0) {
      clearInterval(room.timer);
      nextTurn(roomId);
    }
  }, 1000);
}

/* ---------------- TURN HANDLER ---------------- */

function nextTurn(roomId) {
  const room = rooms[roomId];
  if (!room || room.players.length === 0) return;

  room.round++;

  if (room.round > MAX_ROUNDS) {
    clearInterval(room.timer);
    io.to(roomId).emit("gameOver", room.players);
    return;
  }

  room.drawerIndex = (room.drawerIndex + 1) % room.players.length;
  room.word = getWord();
  room.hintIndex = 0;
  room.maxRounds = MAX_ROUNDS; // ✅ expose to client

  io.to(roomId).emit("roomUpdate", room);
  io.to(roomId).emit("turnStart");
  io.to(room.players[room.drawerIndex].id).emit(
    "secretWord",
    room.word
  );

  startTimer(roomId);
}

/* ---------------- SOCKET ---------------- */

io.on("connection", (socket) => {
  console.log("✅ Connected:", socket.id);
socket.on("playAgain", ({ roomId }) => {
  const room = rooms[roomId];
  if (!room) return;

  // reset scores
  room.players.forEach((p) => (p.score = 0));

  // reset game state
  room.round = 0;
  room.drawerIndex = 0;
  room.word = "";
  room.hintIndex = 0;
  room.started = false;

  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }

  io.to(roomId).emit("roomUpdate", room);
});
  socket.on("joinRoom", ({ roomId, username }) => {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      players: [],
      drawerIndex: 0,
      word: "",
      round: 0,
      maxRounds: MAX_ROUNDS,
      hintIndex: 0,
      timer: null,
      started: false,
    };
  }

  const room = rooms[roomId];

  // ✅ PREVENT DUPLICATE PLAYER
  const existingPlayer = room.players.find(
    (p) => p.username === username
  );

  if (existingPlayer) {
    // update socket id on reload / reconnect
    existingPlayer.id = socket.id;
  } else {
    room.players.push({
      id: socket.id,
      username,
      score: 0,
    });
  }

  socket.join(roomId);
  io.to(roomId).emit("roomUpdate", room);
});


  socket.on("playerReady", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.started) return;

    room.started = true;
    room.round = 1;
    room.word = getWord();
    room.hintIndex = 0;
    room.maxRounds = MAX_ROUNDS;

    io.to(roomId).emit("roomUpdate", room);
    io.to(roomId).emit("turnStart");
    io.to(room.players[room.drawerIndex].id).emit(
      "secretWord",
      room.word
    );

    startTimer(roomId);
  });

  socket.on("sendMessage", ({ roomId, message, username }) => {
  const room = rooms[roomId];
  if (!room) return;

  const drawer = room.players[room.drawerIndex];
  const isDrawer = drawer?.id === socket.id;

  // ✅ Always broadcast chat message
  io.to(roomId).emit("receiveMessage", { username, message });

  // ❌ Drawer cannot guess or score
  if (isDrawer) return;

  // ✅ Only non-drawers can guess
  if (message.toLowerCase() === room.word.toLowerCase()) {
    const guesser = room.players.find(
      (p) => p.id === socket.id
    );

    if (guesser) guesser.score += 10;

    clearInterval(room.timer);
    nextTurn(roomId);
  }
});


  socket.on("requestHint", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    const lettersToShow =
      room.word.length <= 3 ? 1 : Math.min(2, room.word.length);

    room.hintIndex = Math.min(
      room.hintIndex + 1,
      lettersToShow
    );

    const hint = room.word
      .split("")
      .map((ch, i) => (i < room.hintIndex ? ch : "_"))
      .join(" ");

    socket.emit("hint", hint);
  });

  socket.on("drawing", (data) => {
    socket.to(data.roomId).emit("drawing", data);
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      room.players = room.players.filter(
        (p) => p.id !== socket.id
      );

      if (room.players.length === 0) delete rooms[roomId];
      else io.to(roomId).emit("roomUpdate", room);
    }
  });
});

/* ---------------- START SERVER ---------------- */

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

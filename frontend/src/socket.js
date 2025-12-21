import { io } from "socket.io-client";

export const socket = io("https://scribble-game-bjrn.onrender.com", {
  transports: ["websocket"],
  autoConnect: true
});

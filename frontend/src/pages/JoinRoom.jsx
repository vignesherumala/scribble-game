import React, { useState } from "react";
import { socket } from "../socket";
import { useNavigate } from "react-router-dom";

export default function JoinRoom() {
  const [roomId, setRoomId] = useState("");
  const name = localStorage.getItem("playerName");
  const navigate = useNavigate();

  function joinRoom() {
    if (!roomId.trim()) return alert("Enter room ID");

    socket.auth = { name };
    socket.connect();

    socket.emit("join-room", roomId);

    socket.on("room-joined", () => {
      navigate(`/room/${roomId}`);
    });
  }

  return (
    <div className="flex flex-col items-center mt-20 gap-4">
      <input
        className="border p-2 rounded w-64"
        placeholder="Enter room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />

      <button
        className="bg-green-500 text-white px-4 py-2 rounded"
        onClick={joinRoom}
      >
        Join Room
      </button>
    </div>
  );
}

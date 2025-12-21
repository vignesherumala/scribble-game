import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");

  const createRoom = () => {
    if (!name.trim()) {
      alert("Enter your name");
      return;
    }

    const newRoomId = Math.floor(100000 + Math.random() * 900000).toString();

    // Store username so Room.jsx can read it
    localStorage.setItem("username", name.trim());

    navigate(`/room/${newRoomId}`);
  };

  const joinRoom = () => {
    if (!name.trim() || !roomId.trim()) {
      alert("Enter name and room ID");
      return;
    }

    localStorage.setItem("username", name.trim());
    navigate(`/room/${roomId.trim()}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Draw & Guess
        </h2>

        <input
          type="text"
          placeholder="Your name"
          className="w-full border p-2 rounded mb-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={createRoom}
          className="w-full bg-blue-500 text-white py-2 rounded mb-3"
        >
          Create Room
        </button>

        <div className="text-center text-gray-500 mb-2">OR</div>

        <input
          type="text"
          placeholder="Room ID"
          className="w-full border p-2 rounded mb-3"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <button
          onClick={joinRoom}
          className="w-full bg-green-500 text-white py-2 rounded"
        >
          Join Room
        </button>
      </div>
    </div>
  );
}

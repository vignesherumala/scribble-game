import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { socket } from "../socket";

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();

  const players = location.state?.players;
  const roomId = location.state?.roomId;

  if (!players || players.length === 0 || !roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow text-center">
          <p className="text-lg mb-4">No result data found</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const topScore = sorted[0].score;
  const winners = sorted.filter((p) => p.score === topScore);

  const handlePlayAgain = () => {
    socket.emit("playAgain", { roomId });
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow w-96 text-center">

        <h2 className="text-3xl font-bold mb-4">🎉 Game Over</h2>

        {winners.length > 1 ? (
          <p className="text-xl text-orange-600 mb-4">🤝 Match Draw!</p>
        ) : (
          <p className="text-xl text-green-600 mb-4">
            🏆 Winner: {winners[0].username}
          </p>
        )}

        <h4 className="font-semibold mb-2">Scoreboard</h4>
        <ul className="mb-6">
          {sorted.map((p) => (
            <li key={p.id} className="flex justify-between border-b py-1">
              <span>{p.username}</span>
              <span>{p.score}</span>
            </li>
          ))}
        </ul>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate("/")}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Exit
          </button>

          <button
            onClick={handlePlayAgain}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

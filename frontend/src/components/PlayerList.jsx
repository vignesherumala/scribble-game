import React from "react";

export default function PlayerList({ players = [], drawerId }) {
  return (
    <div className="bg-gray-50 p-4 rounded shadow">
      <h4 className="font-semibold mb-3">Players</h4>

      <ul className="space-y-2">
        {players.map((p) => (
          <li
            key={p.id}
            className="p-2 rounded bg-white flex justify-between"
          >
            <div>
              <div className="font-medium">{p.username}</div>
              <div className="text-xs text-gray-500">
                {p.id === drawerId ? "🎨 Drawing" : "✏️ Guessing"}
              </div>
            </div>
            <div className="font-semibold">{p.score}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

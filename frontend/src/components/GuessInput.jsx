// src/components/GuessInput.jsx
import React, { useEffect, useState } from "react";

export default function GuessInput({ socket, roomId, name, disabled }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const onChat = (msg) => {
      setMessages((m) => [...m, { type: "chat", ...msg }]);
    };
    const onSys = (m) => {
      setMessages((s) => [...s, { type: "system", text: m.text }]);
    };
    const onCorrect = ({ who, word }) => {
      setMessages((m) => [...m, { type: "correct", who, word }]);
    };

    socket.on("chat-message", onChat);
    socket.on("message", onSys);
    socket.on("correct-guess", onCorrect);

    return () => {
      socket.off("chat-message", onChat);
      socket.off("message", onSys);
      socket.off("correct-guess", onCorrect);
    };
  }, [socket]);

  const submit = () => {
    const guess = text.trim();
    if (!guess) return;
    socket.emit("guess", { roomId, name, guess });
    setText("");
  };

  const onKey = (e) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="mt-4">
      <div className="h-40 overflow-auto bg-white p-2 rounded border">
        {messages.map((m, i) => {
          if (m.type === "system") return <div key={i} className="text-sm text-gray-500">[SYSTEM] {m.text}</div>;
          if (m.type === "correct") return <div key={i} className="text-sm text-green-600 font-semibold">🎉 {m.who} guessed the word: {m.word}</div>;
          return <div key={i} className="text-sm"><strong>{m.from}:</strong> {m.text}</div>;
        })}
      </div>

      <div className="flex gap-2 mt-2">
        <input
          disabled={disabled}
          placeholder={disabled ? "Drawer cannot guess" : "Type your guess..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          className="flex-1 border p-2 rounded"
        />
        <button onClick={submit} disabled={disabled} className="bg-blue-600 text-white px-3 py-1 rounded">
          Guess
        </button>
      </div>
    </div>
  );
}

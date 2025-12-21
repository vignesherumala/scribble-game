import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export default function ChatBox({ roomId, username, isDrawer }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const handler = (msg) => {
      setMessages(prev => [...prev, msg]);
    };

    socket.on("receiveMessage", handler);
    return () => socket.off("receiveMessage", handler);
  }, []);

  const send = () => {
    if (!message.trim()) return;
    socket.emit("sendMessage", { roomId, message, username });
    setMessage("");
  };

  return (
    <div className="mt-4">
      <div className="h-48 border p-2 overflow-y-auto bg-gray-50">
        {messages.map((m, i) => (
          <div key={i}>
            <b>{m.username}:</b> {m.message}
          </div>
        ))}
      </div>

      <div className="flex mt-2">
        <input
          disabled={isDrawer}
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          className="flex-1 border p-2"
          placeholder={isDrawer ? "Drawing..." : "Type guess..."}
        />
        <button
          onClick={send}
          disabled={isDrawer}
          className="bg-blue-500 text-white px-4"
        >
          Send
        </button>
      </div>
    </div>
  );
}

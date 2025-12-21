import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket";

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const [room, setRoom] = useState(null);
  const [started, setStarted] = useState(false);
  const [secretWord, setSecretWord] = useState("");
  const [hint, setHint] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawing = useRef(false);

  /* ---------------- SOCKET ---------------- */

  useEffect(() => {
    socket.emit("joinRoom", { roomId, username });

    const onRoomUpdate = (room) => setRoom(room);

    const onTurnStart = () => {
      setStarted(true);
      setSecretWord("");
      setHint("");
      initCanvas();
    };

    const onSecretWord = (word) => setSecretWord(word);
    const onHint = (h) => setHint(h);
    const onTimerUpdate = (t) => setTimeLeft(t);

    const onReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const onDrawing = ({ x, y, type }) => {
      if (!ctxRef.current) return;

      if (type === "begin") {
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(x, y);
      } else {
        ctxRef.current.lineTo(x, y);
        ctxRef.current.stroke();
      }
    };

      const onGameOver = (players) => {
      navigate("/result", {
        state: {
          players,
          roomId,
        },
      });
    };


    socket.on("roomUpdate", onRoomUpdate);
    socket.on("turnStart", onTurnStart);
    socket.on("secretWord", onSecretWord);
    socket.on("hint", onHint);
    socket.on("timerUpdate", onTimerUpdate);
    socket.on("receiveMessage", onReceiveMessage);
    socket.on("drawing", onDrawing);
    socket.on("gameOver", onGameOver);

    return () => {
      socket.off("roomUpdate", onRoomUpdate);
      socket.off("turnStart", onTurnStart);
      socket.off("secretWord", onSecretWord);
      socket.off("hint", onHint);
      socket.off("timerUpdate", onTimerUpdate);
      socket.off("receiveMessage", onReceiveMessage);
      socket.off("drawing", onDrawing);
      socket.off("gameOver", onGameOver);
    };
  }, [roomId, username, navigate]);

  /* ---------------- CANVAS INIT ---------------- */

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctxRef.current = ctx;
  };

  const isDrawer = () =>
    room?.players?.[room.drawerIndex]?.username === username;

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  /* ---------------- DRAW ---------------- */

  const startDraw = (e) => {
    if (!started || !isDrawer() || !ctxRef.current) return;

    drawing.current = true;
    const { x, y } = getPos(e);

    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    socket.emit("drawing", { roomId, x, y, type: "begin" });
  };

  const draw = (e) => {
    if (!drawing.current || !isDrawer() || !ctxRef.current) return;

    const { x, y } = getPos(e);
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
    socket.emit("drawing", { roomId, x, y, type: "draw" });
  };

  const endDraw = () => {
    drawing.current = false;
  };

  if (!room) return <p className="p-6">Loading room...</p>;

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow">

        <h2 className="text-xl font-bold">Room {roomId}</h2>

        {/* ✅ ROUND DISPLAY (UI ONLY) */}
        <p className="text-sm text-gray-600 mb-2">
          Round <b>{room.round ?? 1}</b> / 5
        </p>

        <p>
          Drawer: <b>{room.players[room.drawerIndex]?.username}</b>
        </p>

        {isDrawer() && started && (
          <p className="text-green-600 font-semibold mt-2">
            Secret Word: {secretWord}
          </p>
        )}

        {!isDrawer() && started && hint && (
          <p className="text-blue-600 font-semibold mt-2">
            Hint: {hint}
          </p>
        )}

        {!isDrawer() && started && (
          <button
            className="bg-yellow-500 text-white px-3 py-1 rounded mt-2"
            onClick={() => socket.emit("requestHint", { roomId })}
          >
            Get Hint
          </button>
        )}

        {!started && (
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded my-4"
            onClick={() => socket.emit("playerReady", { roomId })}
          >
            Start Game
          </button>
        )}

        {started && <p>⏱ Time Left: {timeLeft}</p>}

        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="col-span-3">
            <canvas
              ref={canvasRef}
              width={700}
              height={400}
              className="border bg-white rounded"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
            />

            <div className="border h-40 mt-3 p-2 overflow-y-auto">
              {messages.map((m, i) => (
                <div key={i}>
                  <b>{m.username}:</b> {m.message}
                </div>
              ))}
            </div>

            <div className="flex mt-2">
             <input
                className="flex-1 border p-2"
                value={message}
                disabled={isDrawer()}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isDrawer() ? "Drawer cannot chat" : "Type guess..."}
             />

            <button
                  className={`px-4 text-white ${
                    isDrawer() ? "bg-gray-400 cursor-not-allowed" : "bg-green-500"
                  }`}
                  disabled={isDrawer()}
                  onClick={() => {
                    if (!message.trim()) return;
                    socket.emit("sendMessage", { roomId, message, username });
                    setMessage("");
                  }}
                >
                  Send
          </button>

            </div>
          </div>

          <div className="border p-3 rounded">
            <h4 className="font-semibold mb-2">Players</h4>
            {room.players.map((p) => (
              <div key={p.id}>
                {p.username} — {p.score}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

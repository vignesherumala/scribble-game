import React, { useEffect, useRef, useState } from "react";
import { socket } from "../socket";

export default function DrawingBoard({ roomId, isDrawer }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 900;
    canvas.height = 450;

    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctxRef.current = ctx;

    const onRemoteDraw = (data) => {
      draw(data.x0, data.y0, data.x1, data.y1, false);
    };

    const onClear = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    socket.on("drawing", onRemoteDraw);
    socket.on("clearCanvas", onClear);

    return () => {
      socket.off("drawing", onRemoteDraw);
      socket.off("clearCanvas", onClear);
    };
  }, []);

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function draw(x0, y0, x1, y1, emit = true) {
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    if (emit) {
      socket.emit("drawing", {
        roomId,
        data: { x0, y0, x1, y1 }
      });
    }
  }

  const down = (e) => {
    if (!isDrawer) return;
    last.current = pos(e);
    setDrawing(true);
  };

  const move = (e) => {
    if (!drawing || !isDrawer) return;
    const p = pos(e);
    draw(last.current.x, last.current.y, p.x, p.y);
    last.current = p;
  };

  const up = () => setDrawing(false);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={down}
      onMouseMove={move}
      onMouseUp={up}
      onMouseLeave={up}
      className={`border rounded bg-white ${
        !isDrawer ? "opacity-60 pointer-events-none" : ""
      }`}
    />
  );
}

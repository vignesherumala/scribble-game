import React, { useRef, useEffect, useState } from "react";

export default function CanvasBoard({ socket, roomId, role }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const lastRef = useRef({ x: 0, y: 0 });
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 800;
    canvas.height = 500;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "black";
    ctxRef.current = ctx;
  }, []);

  // Server strokes
  useEffect(() => {
    socket.on("draw-data", (stroke) => {
      draw(stroke.x0, stroke.y0, stroke.x1, stroke.y1);
    });
    return () => socket.off("draw-data");
  }, []);

  function getPos(e) {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function start(e) {
    if (role !== "drawer") return;
    setDrawing(true);
    lastRef.current = getPos(e);
  }

  function stop() {
    setDrawing(false);
  }

  function move(e) {
    if (!drawing || role !== "drawer") return;

    const newPos = getPos(e);
    const prev = lastRef.current;

    draw(prev.x, prev.y, newPos.x, newPos.y);

    socket.emit("draw-data", {
      roomId,
      stroke: { x0: prev.x, y0: prev.y, x1: newPos.x, y1: newPos.y },
    });

    lastRef.current = newPos;
  }

  function draw(x0, y0, x1, y1) {
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  return (
    <canvas
      ref={canvasRef}
      className="bg-white border rounded"
      onMouseDown={start}
      onMouseMove={move}
      onMouseUp={stop}
      onMouseLeave={stop}
    />
  );
}

import React, { useEffect, useState } from "react";
import { socket } from "../socket";
import { useNavigate } from "react-router-dom";

export default function CreateRoom() {
  const navigate = useNavigate();
  const name = localStorage.getItem("playerName");

  useEffect(() => {
    if (!name) navigate("/");

    socket.auth = { name };
    socket.connect();

    socket.emit("create-room");

    socket.on("room-created", (roomId) => {
      navigate(`/room/${roomId}`);
    });

    return () => {
      socket.off("room-created");
    };
  }, []);

  return <h2 className="text-center mt-20 text-xl">Creating room...</h2>;
}

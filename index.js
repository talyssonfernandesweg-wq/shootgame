// server/index.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.static("../client"));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "https://shootmulti.loca.lt"], // Permite o localhost e a URL do seu túnel
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true // Permite cookies e credenciais
    },
  });

let rooms = {};

io.on("connection", (socket) => {
  console.log("Novo jogador:", socket.id);

  socket.on("create_room", () => {
    const roomId = Math.random().toString(36).substring(2, 7);
    rooms[roomId] = { players: {}, hostId: socket.id, started: false };
    rooms[roomId].players[socket.id] = { x: 100, y: 100, alive: true };
    console.log('criando sala...');
    socket.join(roomId);
    socket.emit("room_created", roomId);
    console.log(`Sala criada: ${roomId}`);
  });

  socket.on("join_room", (roomId) => {
    if (!rooms[roomId]) {
      socket.emit("error_message", "Sala não encontrada");
      return;
    }
    if (Object.keys(rooms[roomId].players).length >= 5) {
      socket.emit("error_message", "Sala cheia");
      return;
    }
    rooms[roomId].players[socket.id] = { x: 100, y: 100, alive: true };
    socket.join(roomId);
    io.to(roomId).emit("update_players", rooms[roomId].players);
  });

  socket.on("start_game", (roomId) => {
    const room = rooms[roomId];
    if (room && room.hostId === socket.id) {
      room.started = true;
      io.to(roomId).emit("update_players", room.players); // <--- envia jogadores antes
      io.to(roomId).emit("start_game"); // <--- inicia o jogo
      console.log("Partida iniciada:", roomId);
    }
  });  

  socket.on("player_move", ({ roomId, x, y }) => {
    if (rooms[roomId]?.players[socket.id]) {
      rooms[roomId].players[socket.id].x = x;
      rooms[roomId].players[socket.id].y = y;
      io.to(roomId).emit("update_positions", rooms[roomId].players);
    }
  });

  socket.on("player_dead", (roomId) => {
    if (rooms[roomId]?.players[socket.id]) {
      rooms[roomId].players[socket.id].alive = false;
      io.to(roomId).emit("update_players", rooms[roomId].players);
    }
  });

  socket.on("disconnect", () => {
    for (const [roomId, room] of Object.entries(rooms)) {
      if (room.players[socket.id]) {
        delete room.players[socket.id];
        io.to(roomId).emit("update_players", room.players);
        if (Object.keys(room.players).length === 0) delete rooms[roomId];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Servidor rodando na porta", PORT));

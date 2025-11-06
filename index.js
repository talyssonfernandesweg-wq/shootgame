import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename).replace(/^\/([A-Za-z]):\//, "$1:/");

console.log("dirname" + __dirname)
const app = express();
app.use(cors());

// Serve os arquivos estáticos da pasta "cliente"
app.use(express.static(path.join(__dirname, "client")));

// Rota para servir o index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://shootmulti.loca.lt"], // Permite o localhost e a URL do seu túnel
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true // Permite cookies e credenciais
  }
});

// --- SOCKET.IO ---
let rooms = {};

io.on("connection", (socket) => {
  console.log("Novo jogador:", socket.id);

  socket.on("create_room", () => {
    const roomId = Math.random().toString(36).substring(2, 7);
    rooms[roomId] = { players: {}, hostId: socket.id, started: false };
    rooms[roomId].players[socket.id] = { x: 100, y: 100, alive: true, hp: 100 };
    socket.join(roomId);
    socket.roomId = roomId;
    socket.emit("room_created", roomId);
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
    rooms[roomId].players[socket.id] = { x: 100, y: 100, alive: true, hp: 100 };
    socket.join(roomId);
    socket.roomId = roomId;
    io.to(roomId).emit("update_players", rooms[roomId].players);
  });

  socket.on("start_game", (roomId) => {
    const room = rooms[roomId];
    if (room && room.hostId === socket.id) {
      room.started = true;
      io.to(roomId).emit("update_players", room.players);
      io.to(roomId).emit("start_game");
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

  socket.on("shoot_bullet", (bullet) => {
    const roomId = socket.roomId;
    console.log("room: " + roomId)
    if (!roomId) return;

    const room = rooms[roomId];

    for (const [id, p] of Object.entries(room.players)) {

      if (id === socket.id) continue; 
      if (
        bullet.x < p.x + 30 && bullet.x > p.x &&
        bullet.y < p.y + 30 && bullet.y > p.y
      ) {
        
        p.hp -= 10;
        if (p.hp <= 0) p.alive = false;
        console.log("bala some ao atingir alguém")
        io.to(roomId).emit("update_players", room.players);
        return; 
      }
    }

    
    io.to(roomId).emit("bullet_fired", bullet);
  });

});

// --- SERVER ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Servidor rodando na porta", PORT));

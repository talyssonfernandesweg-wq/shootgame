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

app.use(express.static(path.join(__dirname, "client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://shootmulti.loca.lt"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true 
  }
});

// --- SOCKET.IO ---
let rooms = {};

io.on("connection", (socket) => {

  socket.on("create_room", (name) => {
    const roomId = Math.random().toString(36).substring(2, 7);
    rooms[roomId] = { players: {}, hostId: socket.id, started: false };
    rooms[roomId].players[socket.id] = { 
      x: 100, 
      y: 100, 
      alive: true, 
      hp: 100,
      name: name || "Jogador"
    };
    socket.join(roomId);
    socket.roomId = roomId;
    socket.emit("room_created", roomId);
  });

  socket.on("join_room", ({ roomId, name }) => {
    if (!rooms[roomId]) {
      socket.emit("error_message", "Sala não encontrada");
      return;
    }
    if (Object.keys(rooms[roomId].players).length >= 5) {
      socket.emit("error_message", "Sala cheia");
      return;
    }

    rooms[roomId].players[socket.id] = { 
      x: 100, 
      y: 100, 
      alive: true, 
      hp: 100,
      name: name || "Jogador"
    };
    socket.join(roomId);
    socket.roomId = roomId;
    io.to(roomId).emit("update_players", rooms[roomId].players);
  });

  socket.on("start_game", (roomId) => {
    const room = rooms[roomId];
    if (room && room.hostId === socket.id) {
      room.started = true;
      rooms[roomId].players[socket.id] = { 
        x: 100, 
        y: 100, 
        alive: true, 
        hp: 100
      };
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
    if (!roomId) return;

    const room = rooms[roomId];
    if (!room.bullets) room.bullets = [];

    bullet.shooter = socket.id;
    bullet.dir = bullet.dir || "right";
    room.bullets.push(bullet);
  });

  setInterval(() => {
    for (const [roomId, room] of Object.entries(rooms)) {
      if (!room.bullets) continue;

      for (let i = room.bullets.length - 1; i >= 0; i--) {
        const b = room.bullets[i];
        b.x += b.dir === "right" ? 2 : -2;

        // Saiu do mapa
        if (b.x < 0 || b.x > 1600) {
          room.bullets.splice(i, 1);
          continue;
        }

        // Colisão com jogadores
        for (const [id, p] of Object.entries(room.players)) {
          if (!p.alive || id === b.shooter) continue;
          if (b.x > p.x && b.x < p.x + 30 && b.y > p.y && b.y < p.y + 30) {
            p.hp -= 1;
            if (p.hp <= 0) p.alive = false;
            room.bullets.splice(i, 1);
            io.to(roomId).emit("update_players", room.players);
            break;
          }
        }
      }

      io.to(roomId).emit("update_bullets", room.bullets);
    }
  }, 1000 / 60);

});

// --- SERVER ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Servidor rodando na porta", PORT));

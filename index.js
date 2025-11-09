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

app.get(`/`, (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://shootmulti.loca.lt", "https:///shoot-sco.organizza.com.br", "https://organizza.com.br", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true 
  }
});

// --- SOCKET.IO ---
let rooms = {};

const platforms = [
  { x: -10, y: 0, width: 10, height: 1600 },
  { x: 1600, y: 0, width: 10, height: 1600 },
  { x: 700, y: 370, width: 10, height: 100 },
  { x: 1100, y: 180, width: 10, height: 100 },
  { x: 950, y: 470, width: 10, height: 100 },
  { x: 800, y: 680, width: 10, height: 100 },
  { x: 100, y: 450, width: 600, height: 20 },
  { x: 0, y: 550, width: 300, height: 20 },
  { x: 0, y: 650, width: 500, height: 20 },
  { x: 550, y: 550, width: 600, height: 20 },
  { x: 700, y: 450, width: 150, height: 20 },
  { x: 300, y: 350, width: 200, height: 20 },
  { x: 600, y: 280, width: 800, height: 20 },
  { x: 1200, y: 650, width: 300, height: 20 },
  { x: 1400, y: 550, width: 200, height: 20 },
];

io.on("connection", (socket) => {

  socket.on("create_room", (name, character) => {
    const roomId = Math.random().toString(36).substring(2, 7);
    rooms[roomId] = { players: {}, hostId: socket.id, started: false };
    rooms[roomId].players[socket.id] = { 
      x: 100, 
      y: 100, 
      alive: true, 
      hp: 100,
      name: name || "Jogador",
      character: character || "Charles",
      action: "idle",
      facing: "right"
    };
    socket.join(roomId);
    socket.roomId = roomId;
    console.log("create_room: " + roomId);
    socket.emit("room_created", roomId);
  });

  socket.on("join_room", ({ roomId, name, character }) => {
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
      name: name || "Jogador",
      character: character || "Charles",
      action: "idle",
      facing: "right"
    };
    socket.join(roomId);
    socket.roomId = roomId;
    io.to(roomId).emit("update_players", rooms[roomId].players);
  });

  socket.on("start_game", (roomId) => {
    const room = rooms[roomId];
    if (room && room.hostId === socket.id) {
      room.started = true;

      // Reinicia todos os jogadores
      for (const [id, player] of Object.entries(room.players)) {
        room.players[id] = {
          ...player, // mantém nome, personagem, etc.
          x: 100,
          y: 100,
          hp: 100,
          alive: true,
          action: "idle",
          facing: "right"
        };
      }

      io.to(roomId).emit("update_players", room.players);
      io.to(roomId).emit("start_game");
    }
  });

  socket.on("player_move", ({ roomId, x, y, action, facing }) => {
    if (rooms[roomId]?.players[socket.id]) {
      const player = rooms[roomId].players[socket.id];
      player.x = x;
      player.y = y;
      if (action) player.action = action;
      if (facing) player.facing = facing;
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

  let lastTime = Date.now();
  setInterval(() => {
      const now = Date.now();
      const deltaTime = now - lastTime; // ms desde o último tick
      lastTime = now;
    
      for (const [roomId, room] of Object.entries(rooms)) {
        if (!room.bullets) continue;
    
        for (let i = room.bullets.length - 1; i >= 0; i--) {
          const b = room.bullets[i];
          const BULLET_SPEED = 6; // pixels a cada 16ms (~60fps)
          b.x += (b.dir === "right" ? 1 : -1) * BULLET_SPEED * (deltaTime / 16.67);
    
          // --- Saiu do mapa ---
          if (b.x < 0 || b.x > 1600) {
            room.bullets.splice(i, 1);
            continue;
          }
    
          let bulletRemoved = false;
    
          // --- Colisão com plataformas ---
          for (const plat of platforms) {
            const bulletWidth = 8;
            const bulletHeight = 4;
    
            const bulletLeft = b.x - bulletWidth / 2;
            const bulletRight = b.x + bulletWidth / 2;
            const bulletTop = b.y - bulletHeight / 2;
            const bulletBottom = b.y + bulletHeight / 2;
    
            if (
              bulletRight > plat.x &&
              bulletLeft < plat.x + plat.width &&
              bulletBottom > plat.y &&
              bulletTop < plat.y + plat.height
            ) {
              room.bullets.splice(i, 1);
              bulletRemoved = true;
              break;
            }
          }
    
          if (bulletRemoved) continue;
    
          // --- Colisão com jogadores ---
          for (const [id, p] of Object.entries(room.players)) {
            if (!p.alive || id === b.shooter) continue;
            if (b.x > p.x && b.x < p.x + 30 && b.y > p.y && b.y < p.y + 30) {
              p.hp -= 1;
              if (p.hp <= 0) {
                p.alive = room.started ? false : true;
                p.hp = room.started ? 0 : 100;
              }
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
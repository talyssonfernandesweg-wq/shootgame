const socket = io();

let roomId = null;

socket.on("room_created", (id) => {
  roomId = id;
  document.getElementById("status").innerText = "Sala criada: " + id;
});

socket.on("update_players", (players) => {
    window.updatePlayers(players);
    document.getElementById("playerCount").innerText =
        `Jogadores na sala: ${Object.keys(players).length}`;
});

socket.on("update_positions", (players) => {
  window.updatePlayers(players);
});

socket.on("start_game", () => {
  window.startGame();
});

socket.on("error_message", (msg) => {
  alert(msg);
});

socket.on("bullet_fired", (bullet) => {
  bullets.push(bullet);
});

socket.on("update_bullets", (serverBullets) => {
  bullets = serverBullets;
});

function criarSala() {
    console.log('solicitando para criar sala...');
  socket.emit("create_room");
}

function entrarSala() {
  const id = document.getElementById("roomId").value;
  roomId = id;
  socket.emit("join_room", id);
}

function iniciar() {
  if (roomId) socket.emit("start_game", roomId);
}

function enviarMovimento(x, y) {
  if (roomId) socket.emit("player_move", { roomId, x, y });
}

function enviarTiro(bullet) {
  socket.emit("shoot_bullet", bullet);
}

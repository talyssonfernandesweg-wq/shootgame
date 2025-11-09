const socket = io();

let roomId = null;

socket.on("room_created", (id) => {
    console.log("room id: " + id);
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
  document.body.removeChild(canvas);
  document.getElementById('gameUi').removeAttribute('hidden')
});

socket.on("bullet_fired", (bullet) => {
  bullets.push(bullet);
});

socket.on("update_bullets", (serverBullets) => {
  bullets = serverBullets;
});

function criarSala() {
  document.getElementById('gameUi').setAttribute('hidden', true)
  document.body.appendChild(canvas);
  document.getElementById('btnIniciar').removeAttribute('hidden')
  const name = document.getElementById("playerName").value || "Jogador";
  const character = document.getElementById("characterSelect").value;
  selectedCharacter = character;
  socket.emit("create_room", name, character);
}

function entrarSala() {
  document.getElementById('gameUi').setAttribute('hidden', true)
  document.body.appendChild(canvas);
  const id = document.getElementById("roomId").value;
  const name = document.getElementById("playerName").value || "Jogador";
  const character = document.getElementById("characterSelect").value;
  selectedCharacter = character;
  roomId = id;
  socket.emit("join_room", { roomId: id, name, character });
}

function iniciar() {
  if (roomId) socket.emit("start_game", roomId);
}

function enviarMovimento(x, y) {
  if (roomId) {
    socket.emit("player_move", {
      roomId,
      x,
      y,
      action: currentAction,
      facing: facing
    });
  }
}

function enviarTiro(bullet) {
  socket.emit("shoot_bullet", bullet);
}

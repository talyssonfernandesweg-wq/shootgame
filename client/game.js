const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 400;
document.body.appendChild(canvas);

let players = {};
let myX = 100, myY = 100;
let myVelY = 0;       
let onGround = false;   
let keys = {};
let facing = 'left';

let bullets = [];
const BULLET_SPEED = 6;

const GRAVITY = 0.5;    
const JUMP_FORCE = -10;  
const GROUND_Y = 750;

const MAP_WIDTH = 1600;
const MAP_HEIGHT = 800;

let cameraX = 0;       
let cameraY = 0;

let platforms = [
    //paredes
    { x: -10, y: 0, width: 10, height: 1600 },
    { x: 1600, y: 0, width: 10, height: 1600 },

    //plataformas
    { x: 50, y: 680, width: 400, height: 20 }, 
    { x: 520, y: 600, width: 500, height: 20 },  
    { x: 0, y: 450, width: 700, height: 20 }, 
    { x: 1000, y: 720, width: 200, height: 20 }, 
    { x: 1300, y: 720, width: 200, height: 20 }  
];

const statusDiv = document.createElement("div");
statusDiv.style.position = "absolute";
statusDiv.style.top = "5px";
statusDiv.style.left = "5px";
statusDiv.style.color = "white";
statusDiv.style.font = "16px Arial";
statusDiv.style.background = "rgba(0,0,0,0.5)";
statusDiv.style.padding = "5px";
statusDiv.style.whiteSpace = "pre";
statusDiv.style.zIndex = "10";
document.body.appendChild(statusDiv);

let groundTexture = null;
const groundImage = new Image();
groundImage.src = "https://tse4.mm.bing.net/th/id/OIP.vRr8ScD3Zay6XUF9fVafLwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3";
groundImage.onload = () => {
  groundTexture = ctx.createPattern(groundImage, "repeat");
};

const playerSprite = new Image();
playerSprite.src = "https://pixelartmaker-data-78746291193.nyc3.digitaloceanspaces.com/image/19470f3427cb196.png";
//playerSprite.src = "sprite-animation.gif";


const playerGhost = new Image();
playerGhost.src = "https://i.redd.it/extremely-new-to-pixel-art-and-made-a-ghost-d-v0-kmanq333vfja1.png?s=aaf9123a35ee571227f669c501ffb439ea721d9d";

const backgroundImage = new Image();
backgroundImage.src = "https://wallpaperaccess.com/full/2684833.jpg";

window.updatePlayers = (data) => {
    players = data;
    updateStatus();
};

window.startGame = () => {
  document.getElementById("status").innerText = "Jogo iniciado!";
};

document.addEventListener("keydown", (e) => (keys[e.key] = true));
document.addEventListener("keyup", (e) => (keys[e.key] = false));

function update() {
    if (keys["ArrowLeft"]) { myX -= 3; facing = "left"; }
    if (keys["ArrowRight"]) { myX += 3; facing = "right"; }
    if (keys["ArrowUp"] && onGround) { myVelY = JUMP_FORCE; onGround = false; }
    if ((keys["x"] || keys["X"]) && players[socket.id] && players[socket.id].alive) { shootBullet(); keys["x"] = keys["X"] = false; }

    onGround = false;
    for (const platform of platforms) {
        // Dimensões do jogador e da plataforma
        const playerRight = myX + 30;
        const playerLeft = myX;
        const playerBottom = myY + 30;
        const playerTop = myY;

        const platRight = platform.x + platform.width;
        const platLeft = platform.x;
        const platBottom = platform.y + platform.height;
        const platTop = platform.y;

        // Verifica se há interseção (colisão)
        const horizontalOverlap = playerRight > platLeft && playerLeft < platRight;
        const verticalOverlap = playerBottom > platTop && playerTop < platBottom;

        if (horizontalOverlap && verticalOverlap) {
            const overlapX =
                playerRight > platLeft && playerRight < platRight
                    ? playerRight - platLeft
                    : platRight - playerLeft;
            const overlapY =
                playerBottom > platTop && playerBottom < platBottom
                    ? playerBottom - platTop
                    : platBottom - playerTop;

            // Decide qual eixo tem menos sobreposição (prioriza correção menor)
            if (overlapX < overlapY) {
                // Colisão lateral
                if (myX < platform.x) {
                    myX -= overlapX; // bateu pela esquerda
                } else {
                    myX += overlapX; // bateu pela direita
                }
            } else {
                // Colisão vertical
                if (myY < platform.y) {
                    // Encostou no topo da plataforma (pousou)
                    myY -= overlapY;
                    myVelY = 0;
                    onGround = true;
                } else {
                    // Bateu por baixo (cabeçada)
                    myY += overlapY;
                    if (myVelY < 0) myVelY = 0;
                }
            }
        }
    }

    if (!onGround){
        myVelY += GRAVITY;
    }

    myY += myVelY;

    if (myY + 30 >= GROUND_Y) {
        myY = GROUND_Y - 30;
        myVelY = 0;
        onGround = true;
    }

    cameraX = Math.max(0, Math.min(myX - canvas.width / 2, MAP_WIDTH - canvas.width));
    cameraY = Math.max(0, Math.min(myY - canvas.height / 2, MAP_HEIGHT - canvas.height));

    enviarMovimento(myX, myY);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        ctx.drawImage(
            backgroundImage,
            -cameraX,    
            -cameraY,
            MAP_WIDTH,     
            MAP_HEIGHT
        );
    } else {
        ctx.fillStyle = "#87CEEB"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Desenha o chão
    ctx.fillStyle = groundTexture || "#444";
    ctx.fillRect(0 - cameraX, GROUND_Y - cameraY, MAP_WIDTH, 50);

    ctx.fillStyle = "brown";
    for (const platform of platforms) {
        ctx.fillRect(platform.x - cameraX, platform.y - cameraY, platform.width, platform.height);
    }

    // Desenha os jogadores
    for (const [id, p] of Object.entries(players)) {
        const isMe = id === socket.id;
        const direction = isMe ? facing : "left";

        // Desenha o sprite do jogador
        if (playerSprite.complete && playerSprite.naturalWidth > 0) {
            ctx.save();
            ctx.translate(p.x - cameraX + 16, p.y - cameraY + 16); 
            if (direction === "right") ctx.scale(-1, 1); 
            if (!p.alive){
                ctx.drawImage(playerGhost, -16, -16, 32, 32); 
            } else {
                ctx.drawImage(playerSprite, -16, -16, 32, 32);
            }
            ctx.restore();
        } else {
            ctx.fillStyle = isMe ? "lime" : "red";
            ctx.fillRect(p.x - cameraX, p.y - cameraY, 30, 30);
        }
        
        // Desenha a vida do jogador no topo da tela
        if (p.alive) {
            ctx.fillStyle = "white";
            ctx.fillText(`${p.name}${id === socket.id ? " (Você)" : ""}: ${p.hp} HP`, p.x - cameraX, p.y - cameraY - 10);
        }
    }

    // Desenha as balas
    ctx.fillStyle = "yellow";
    for (const b of bullets) {
        ctx.fillRect(b.x - cameraX - 4, b.y - cameraY - 2, 8, 4);
    }
}

function shootBullet() {
  const bullet = {
    x: myX + 16,
    y: myY + 16,
    dir: facing
  };
  enviarTiro(bullet);
}

function updateStatus() {
    let text = "";
    for (const [id, p] of Object.entries(players)) {
        if (!p.alive) continue; 
        //text += `${id === socket.id ? "Você" : id}: ${p.hp} HP\n`;
    }
    statusDiv.innerText = text;
}
  

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();

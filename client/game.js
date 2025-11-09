const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1200;
canvas.height = 720;

let gameStart = 0;
let canShoot = true;

let players = {};
let myX = 100, myY = 100;
let myVelY = 0;       
let onGround = false;   
let keys = {};
let facing = 'left';

let bullets = [];
const BULLET_SPEED = 6;

const GRAVITY = 0.2;    
const JUMP_FORCE = -7;
const MAX_FALL_SPEED = 3;
const GROUND_Y = 750;

const MAP_WIDTH = 1600;
const MAP_HEIGHT = 800;

let cameraX = 0;       
let cameraY = 0;

let characterSprites = {};
let selectedCharacter = "Charles";
const charSelect = document.getElementById("characterSelect");
if (charSelect) {
  selectedCharacter = charSelect.value;
}

const spriteIdle = new Image();
spriteIdle.src = `${selectedCharacter}/${selectedCharacter}Idle.png`;

const spriteRun = new Image();
spriteRun.src = `${selectedCharacter}/${selectedCharacter}Run.png`;

const spriteAttack = new Image();
spriteAttack.src = `${selectedCharacter}/${selectedCharacter}Attack.png`;

let currentAction = "idle"; // idle, run, attack
let actionFrameData = {
  idle: { image: spriteIdle, frames: 6, width: 128, height: 128 },
  run: { image: spriteRun, frames: 10, width: 128, height: 128 },
  attack: { image: spriteAttack, frames: 5, width: 128, height: 128 }
};

let frameIndex = 0;
let frameTimer = 0;
let frameInterval = 100;

const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 50;

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  console.log(`Posição do mouse no canvas: ${Math.round(x)}x${Math.round(y)}`);
});

let platforms = [
    //paredes
    { x: -10, y: 0, width: 10, height: 1600 }, // limite do mapa esquerda
    { x: 1600, y: 0, width: 10, height: 1600 }, // limite do mapa direita
    { x: 700, y: 370, width: 10, height: 100 },
    { x: 1100, y: 180, width: 10, height: 100 },
    { x: 950, y: 470, width: 10, height: 100 },
    { x: 800, y: 680, width: 10, height: 100 },

    //plataformas
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

let groundTexture = null;
const groundImage = new Image();
groundImage.src = "https://tse4.mm.bing.net/th/id/OIP.vRr8ScD3Zay6XUF9fVafLwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3";
groundImage.onload = () => {
  groundTexture = ctx.createPattern(groundImage, "repeat");
};

let platformTexture = null;
const platformImage = new Image();
platformImage.src = "https://tse4.mm.bing.net/th/id/OIP.vRr8ScD3Zay6XUF9fVafLwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3";
platformImage.onload = () => {
    platformTexture = ctx.createPattern(platformImage, "repeat");
  };    


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

    let moving = false;
    let shooting = false;

    if (keys["ArrowLeft"]) { myX -= 1.5; facing = "left"; moving = true;}
    if (keys["ArrowRight"]) { myX += 1.5; facing = "right"; moving = true;}
    if (keys["ArrowUp"] && onGround) { myVelY = JUMP_FORCE; onGround = false; }
    if ((keys["x"] || keys["X"]) && players[socket.id] && players[socket.id].alive && canShoot) {
    // dispara apenas uma vez enquanto a tecla estiver pressionada
        shootBullet();
        canShoot = false; // bloqueia novos tiros até a tecla ser solta
    }

    // quando a tecla for solta, libera o tiro novamente
    if (!keys["x"] && !keys["X"]) {
        canShoot = true;
    }

    if (moving) {
        currentAction = "run";
    } else if (currentAction !== "attack") {
        currentAction = "idle";
    }
        
    frameTimer += 16.67; // ~60fps
    if (frameTimer >= frameInterval) {
        const action = actionFrameData[currentAction];
        frameIndex = (frameIndex + 1) % action.frames;
        frameTimer = 0;
    }
    
    onGround = false;
    for (const platform of platforms) {
        // Dimensões do jogador e da plataforma
        const playerRight = myX + PLAYER_WIDTH;
        const playerLeft = myX;
        const playerBottom = myY + PLAYER_HEIGHT;
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
        if (myVelY > MAX_FALL_SPEED) myVelY = MAX_FALL_SPEED;
    }

    myY += myVelY;

    if (myY + PLAYER_HEIGHT >= GROUND_Y) {
        myY = GROUND_Y - PLAYER_HEIGHT;
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
    if (groundTexture) {
        ctx.save();  
    
        ctx.translate(-cameraX % groundImage.width, 0);
        ctx.fillStyle = groundTexture;
    
        ctx.fillRect(0, GROUND_Y - cameraY, MAP_WIDTH + groundImage.width, 50);
    
        ctx.restore(); 
    } else {
        ctx.fillStyle = "#444";
        ctx.fillRect(0 - cameraX, GROUND_Y - cameraY, MAP_WIDTH, 50);
    }

    if (platformTexture) {
        const pattern = platformTexture; // seu ctx.createPattern(…) já está pronto
        const matrix = new DOMMatrix();
        matrix.e = -cameraX % platformImage.width; // desloca horizontalmente
        matrix.f = -cameraY % platformImage.height; // desloca verticalmente
        pattern.setTransform(matrix);
    
        ctx.fillStyle = pattern;
    } else {
        ctx.fillStyle = "#444";
    }
    
    for (const platform of platforms) {
        ctx.fillRect(platform.x - cameraX, platform.y - cameraY, platform.width, platform.height);
    
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x - cameraX, platform.y - cameraY, platform.width, platform.height);
    }

    // Desenha os jogadores
    for (const [id, p] of Object.entries(players)) {
        const isMe = id === socket.id;
        const direction = p.facing || "right";

        // Desenha o sprite do jogador
        if (spriteRun.complete && spriteRun.naturalWidth > 0) {
            ctx.save();
            ctx.translate(p.x - cameraX + 16, p.y - cameraY + 16);
          
            if (direction === "left") ctx.scale(-1, 1);
          
            if (!p.alive) {
              ctx.drawImage(playerGhost, -16, -16, 32, 32);
            } else {
                const charSprites = getCharacterSprites(p.character || selectedCharacter);
                const actionName = p.action || "idle";
                const action = charSprites[actionName] || charSprites.idle;
                const img = action.image;
                const sx = frameIndex * action.width;
                const sy = 0;
                const sw = action.width;
                const sh = action.height;
          
                ctx.drawImage(
                    img,
                    sx, sy, sw, sh,
                    -48, -PLAYER_HEIGHT - 12, 96, 96
                );
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
    if (selectedCharacter == 'Luna') ctx.fillStyle = "red";;
    for (const b of bullets) {
        ctx.fillRect(b.x - cameraX - 4, b.y - cameraY - 2, 8, 4);
    }
}

function shootBullet() {
    if (currentAction !== "attack") {
        currentAction = "attack";
        frameIndex = 0;
        frameTimer = 0;

        // Retornar ao idle após a animação de ataque terminar
        setTimeout(() => {
            if (currentAction === "attack") currentAction = "idle";
        }, actionFrameData.attack.frames * frameInterval);
    }

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
    //statusDiv.innerText = text;
}

function getCharacterSprites(character) {
    if (!characterSprites[character]) {
      const idle = new Image();
      idle.src = `${character}/${character}Idle.png`;
  
      const run = new Image();
      run.src = `${character}/${character}Run.png`;
  
      const attack = new Image();
      attack.src = `${character}/${character}Attack.png`;
  
      characterSprites[character] = {
        idle: { image: idle, frames: 6, width: 128, height: 128 },
        run: { image: run, frames: 10, width: 128, height: 128 },
        attack: { image: attack, frames: 5, width: 128, height: 128 },
      };
    }
    return characterSprites[character];
  }
  

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();

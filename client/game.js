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
    { x: 50, y: 680, width: 400, height: 20 },  //personagem pular até 120 de diferença
    { x: 520, y: 600, width: 150, height: 20 },  
    { x: 700, y: 720, width: 150, height: 20 }, 
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

const playerGhost = new Image();
playerGhost.src = "https://i.redd.it/extremely-new-to-pixel-art-and-made-a-ghost-d-v0-kmanq333vfja1.png?s=aaf9123a35ee571227f669c501ffb439ea721d9d";

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
<<<<<<< HEAD

    onGround = false;
    for (const platform of platforms) {
        if (myX + 30 > platform.x && myX < platform.x + platform.width) {
            
            if (myY + 30 <= platform.y && myY + 30 + myVelY >= platform.y) {
                
                myY = platform.y - 30; 
                myVelY = 0;            
                onGround = true;       
            }
        }
    }

    if (!onGround){
        myVelY += GRAVITY;
    }
=======
>>>>>>> 0a68995ed6e8ea3467b571f15e6c09d4409f5b29

    myY += myVelY;
    if (myY + 30 >= GROUND_Y) { myY = GROUND_Y - 30; myVelY = 0; onGround = true; }

    cameraX = Math.max(0, Math.min(myX - canvas.width / 2, MAP_WIDTH - canvas.width));
    cameraY = Math.max(0, Math.min(myY - canvas.height / 2, MAP_HEIGHT - canvas.height));

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.dir === "right" ? BULLET_SPEED : -BULLET_SPEED;

        // Remove bala se saiu da tela
<<<<<<< HEAD
        if (b.x < 0 || b.x > MAP_WIDTH || b.y < 0 || b.y > MAP_HEIGHT) {
=======
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
>>>>>>> 0a68995ed6e8ea3467b571f15e6c09d4409f5b29
            bullets.splice(i, 1);
            continue;
        }

        // Verifica colisões com jogadores
        for (const [id, p] of Object.entries(players)) {
            if (!p.alive) continue;
            if (id === b.shooter) continue; // não atinge quem atirou
            if (b.x > p.x && b.x < p.x + 30 && b.y > p.y && b.y < p.y + 30) {
                // Se acertou, diminui HP e remove a bala
                p.hp -= 10;
                if (p.hp <= 0) p.alive = false;
                bullets.splice(i, 1);
                break;
            }
        }
    }


    enviarMovimento(myX, myY);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha o chão
    ctx.fillStyle = groundTexture || "#444";
<<<<<<< HEAD
    ctx.fillRect(0 - cameraX, GROUND_Y - cameraY, MAP_WIDTH, 50);

    ctx.fillStyle = "brown";
    for (const platform of platforms) {
        ctx.fillRect(platform.x - cameraX, platform.y - cameraY, platform.width, platform.height);
    }
=======
    ctx.fillRect(0, GROUND_Y, canvas.width, 50);
>>>>>>> 0a68995ed6e8ea3467b571f15e6c09d4409f5b29

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
            ctx.fillText(`${id === socket.id ? "Você" : id}: ${p.hp} HP`, p.x - cameraX, p.y - cameraY - 10);
        }
<<<<<<< HEAD
=======
        
        // Desenha a vida do jogador no topo da tela
        if (p.alive) {
            ctx.fillStyle = "white";
            ctx.fillText(`${id === socket.id ? "Você" : id}: ${p.hp} HP`, p.x, p.y - 10);
        }
>>>>>>> 0a68995ed6e8ea3467b571f15e6c09d4409f5b29
    }

    // Desenha as balas
    ctx.fillStyle = "yellow";
    for (const b of bullets) {
<<<<<<< HEAD
        ctx.fillRect(b.x - cameraX - 4, b.y - cameraY - 2, 8, 4);
=======
        ctx.fillRect(b.x - 4, b.y - 2, 8, 4);
>>>>>>> 0a68995ed6e8ea3467b571f15e6c09d4409f5b29
    }
}

function shootBullet() {
    const bullet = {
        x: myX + 16,
        y: myY + 16,
        dir: facing,
        shooter: socket.id
    };
    socket.emit("shoot_bullet", bullet);
}

function updateStatus() {
    let text = "";
    for (const [id, p] of Object.entries(players)) {
        if (!p.alive) continue; 
        text += `${id === socket.id ? "Você" : id}: ${p.hp} HP\n`;
    }
    statusDiv.innerText = text;
}
  

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();

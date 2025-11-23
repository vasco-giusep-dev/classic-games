// CONSTANTS
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.6;
const JUMP_FORCE = -14;
const PLAYER_SPEED = 5;
const PLAYER_SIZE = 30;

// GAME STATE
let canvas, ctx;
let player;
let platforms = [];
let enemies = [];
let coins = [];
let score = 0;
let lives = 3;
let currentLevel = 1;
let gameStarted = false;
let gameOver = false;
let levelComplete = false;
let keys = {};
let animationId = null;

// PLAYER
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = PLAYER_SIZE;
        this.height = PLAYER_SIZE;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.canDoubleJump = true;
        this.direction = 1; // 1 = right, -1 = left
    }

    update() {
        // Horizontal movement
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            this.velocityX = -PLAYER_SPEED;
            this.direction = -1;
        } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            this.velocityX = PLAYER_SPEED;
            this.direction = 1;
        } else {
            this.velocityX = 0;
        }

        // Apply gravity
        this.velocityY += GRAVITY;

        // Fast fall with 'S' key or Down Arrow
        if ((keys['s'] || keys['S'] || keys['ArrowDown']) && !this.onGround) {
            this.velocityY += GRAVITY * 0.8; // Additional downward force
        }

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Check ground collision
        this.onGround = false;

        // Platform collisions
        platforms.forEach(platform => {
            if (this.checkCollision(platform)) {
                // Top collision (landing)
                if (this.velocityY > 0 && this.y + this.height - this.velocityY <= platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.onGround = true;
                    this.canDoubleJump = true;
                }
                // Bottom collision (hitting head)
                else if (this.velocityY < 0 && this.y - this.velocityY >= platform.y + platform.height) {
                    this.y = platform.y + platform.height;
                    this.velocityY = 0;
                }
                // Side collisions
                else if (this.velocityX > 0) {
                    this.x = platform.x - this.width;
                } else if (this.velocityX < 0) {
                    this.x = platform.x + platform.width;
                }
            }
        });

        // World bounds
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > CANVAS_WIDTH) this.x = CANVAS_WIDTH - this.width;

        // Fall death
        if (this.y > CANVAS_HEIGHT) {
            this.die();
        }
    }

    checkCollision(obj) {
        return this.x < obj.x + obj.width &&
            this.x + this.width > obj.x &&
            this.y < obj.y + obj.height &&
            this.y + this.height > obj.y;
    }

    jump() {
        if (this.onGround) {
            this.velocityY = JUMP_FORCE;
            this.onGround = false;
        } else if (this.canDoubleJump) {
            this.velocityY = JUMP_FORCE;
            this.canDoubleJump = false;
        }
    }

    die() {
        lives--;
        updateHUD();

        if (lives <= 0) {
            endGame();
        } else {
            this.respawn();
        }
    }

    respawn() {
        this.x = 50;
        this.y = 100;
        this.velocityX = 0;
        this.velocityY = 0;
    }

    draw() {
        // Body
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#3A86FF');
        gradient.addColorStop(1, '#1a5ccc');

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Eyes
        ctx.fillStyle = '#FFFFFF';
        const eyeY = this.y + this.height * 0.3;
        const eyeOffset = this.direction > 0 ? this.width * 0.6 : this.width * 0.2;
        ctx.fillRect(this.x + eyeOffset, eyeY, 6, 6);

        // Outline
        ctx.strokeStyle = '#0044aa';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

// PLATFORM
class Platform {
    constructor(x, y, width, height, type = 'static') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.moveSpeed = 2;
        this.moveRange = 100;
        this.startX = x;
    }

    update() {
        if (this.type === 'moving') {
            this.x += this.moveSpeed;

            if (this.x > this.startX + this.moveRange || this.x < this.startX - this.moveRange) {
                this.moveSpeed *= -1;
            }
        }
    }

    draw() {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);

        if (this.type === 'moving') {
            gradient.addColorStop(0, '#FF006E');
            gradient.addColorStop(1, '#cc0055');
        } else {
            gradient.addColorStop(0, '#06FFA5');
            gradient.addColorStop(1, '#04cc83');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Pattern
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < this.width; i += 20) {
            ctx.fillRect(this.x + i, this.y, 10, this.height);
        }

        // Outline
        ctx.strokeStyle = this.type === 'moving' ? '#aa0044' : '#03aa6f';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

// ENEMY
class Enemy {
    constructor(x, y, range) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.speed = 1.5;
        this.range = range;
        this.startX = x;
        this.direction = 1;
    }

    update() {
        // Move enemy
        this.x += this.speed * this.direction;

        // Check if enemy is about to fall off platform
        let onPlatform = false;
        let nearEdge = false;

        platforms.forEach(platform => {
            // Check if enemy is standing on this platform
            if (this.x + this.width > platform.x &&
                this.x < platform.x + platform.width &&
                this.y + this.height >= platform.y - 2 &&
                this.y + this.height <= platform.y + 10) {

                onPlatform = true;

                // Check if near left edge
                if (this.direction === -1 && this.x - 5 < platform.x) {
                    nearEdge = true;
                }
                // Check if near right edge
                if (this.direction === 1 && this.x + this.width + 5 > platform.x + platform.width) {
                    nearEdge = true;
                }
            }
        });

        // Turn around if near edge or reached range limit
        if (nearEdge || this.x > this.startX + this.range || this.x < this.startX - this.range) {
            this.direction *= -1;
        }

        // Check collision with player
        if (player.checkCollision(this)) {
            if (player.velocityY > 0 && player.y + player.height - player.velocityY <= this.y + 5) {
                // Player jumped on enemy
                this.defeated = true;
                score += 50;
                player.velocityY = JUMP_FORCE * 0.6;
                updateHUD();
            } else {
                // Player touches enemy from side
                player.die();
            }
        }
    }

    draw() {
        if (this.defeated) return;

        // Body
        ctx.fillStyle = '#FF006E';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x + 5, this.y + 8, 4, 4);
        ctx.fillRect(this.x + this.width - 9, this.y + 8, 4, 4);

        // Angry brow
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 3, this.y + 6);
        ctx.lineTo(this.x + 10, this.y + 10);
        ctx.moveTo(this.x + this.width - 3, this.y + 6);
        ctx.lineTo(this.x + this.width - 10, this.y + 10);
        ctx.stroke();
    }
}

// COIN
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 15;
        this.collected = false;
        this.rotation = 0;
    }

    update() {
        this.rotation += 0.1;

        if (!this.collected && player.checkCollision(this)) {
            this.collected = true;
            score += 10;
            updateHUD();
        }
    }

    draw() {
        if (this.collected) return;

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        ctx.fillStyle = '#FFBE0B';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// LEVELS
function loadLevel(levelNum) {
    platforms = [];
    enemies = [];
    coins = [];

    if (levelNum === 1) {
        // Ground
        platforms.push(new Platform(0, 550, CANVAS_WIDTH, 50));

        // Platforms
        platforms.push(new Platform(200, 450, 150, 20));
        platforms.push(new Platform(450, 350, 150, 20));
        platforms.push(new Platform(150, 250, 120, 20));
        platforms.push(new Platform(400, 150, 150, 20));
        platforms.push(new Platform(650, 100, 100, 20));

        // Enemies
        enemies.push(new Enemy(220, 425, 100));
        enemies.push(new Enemy(460, 325, 80));

        // Coins
        coins.push(new Coin(280, 410));
        coins.push(new Coin(520, 310));
        coins.push(new Coin(200, 210));
        coins.push(new Coin(470, 110));
        coins.push(new Coin(700, 60));
    }
    else if (levelNum === 2) {
        // Ground
        platforms.push(new Platform(0, 550, 200, 50));
        platforms.push(new Platform(600, 550, 200, 50));

        // Moving platforms
        platforms.push(new Platform(200, 450, 100, 20, 'moving'));
        platforms.push(new Platform(400, 350, 100, 20, 'moving'));
        platforms.push(new Platform(200, 250, 100, 20, 'moving'));

        // Static platforms
        platforms.push(new Platform(550, 200, 120, 20));
        platforms.push(new Platform(100, 150, 120, 20));
        platforms.push(new Platform(650, 80, 100, 20));

        // Enemies
        enemies.push(new Enemy(50, 525, 120));
        enemies.push(new Enemy(620, 525, 140));
        enemies.push(new Enemy(560, 175, 90));

        // Coins
        coins.push(new Coin(250, 410));
        coins.push(new Coin(450, 310));
        coins.push(new Coin(250, 210));
        coins.push(new Coin(600, 160));
        coins.push(new Coin(700, 40));
    }
    else if (levelNum === 3) {
        // Ground pieces
        platforms.push(new Platform(0, 550, 150, 50));
        platforms.push(new Platform(650, 550, 150, 50));

        // Staircase
        platforms.push(new Platform(200, 500, 80, 20));
        platforms.push(new Platform(300, 450, 80, 20));
        platforms.push(new Platform(400, 400, 80, 20));
        platforms.push(new Platform(500, 350, 80, 20));

        // Moving platforms
        platforms.push(new Platform(150, 300, 100, 20, 'moving'));
        platforms.push(new Platform(450, 200, 100, 20, 'moving'));

        // Top platforms
        platforms.push(new Platform(100, 100, 100, 20));
        platforms.push(new Platform(600, 50, 150, 20));

        // Enemies
        enemies.push(new Enemy(20, 525, 100));
        enemies.push(new Enemy(670, 525, 100));
        enemies.push(new Enemy(210, 475, 50));
        enemies.push(new Enemy(420, 375, 40));

        // Coins
        coins.push(new Coin(240, 460));
        coins.push(new Coin(340, 410));
        coins.push(new Coin(440, 360));
        coins.push(new Coin(200, 260));
        coins.push(new Coin(500, 160));
        coins.push(new Coin(150, 60));
        coins.push(new Coin(675, 10));
    }

    player.respawn();
}

// GAME LOOP
function update() {
    if (!gameStarted || gameOver || levelComplete) {
        animationId = requestAnimationFrame(update);
        return;
    }

    player.update();

    platforms.forEach(platform => platform.update());
    enemies.forEach(enemy => enemy.update());
    coins.forEach(coin => coin.update());

    // Remove defeated enemies
    enemies = enemies.filter(enemy => !enemy.defeated);

    // Check level complete (reach top right)
    if (player.x > CANVAS_WIDTH - 100 && player.y < 100) {
        completeLevel();
    }

    draw();
    animationId = requestAnimationFrame(update);
}

function draw() {
    // Clear canvas
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a0a2e');
    gradient.addColorStop(1, '#0a0515');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw goal area
    ctx.fillStyle = 'rgba(255, 190, 11, 0.2)';
    ctx.fillRect(CANVAS_WIDTH - 100, 0, 100, 100);
    ctx.strokeStyle = '#FFBE0B';
    ctx.lineWidth = 3;
    ctx.strokeRect(CANVAS_WIDTH - 100, 0, 100, 100);
    ctx.fillStyle = '#FFBE0B';
    ctx.font = '20px Orbitron';
    ctx.fillText('META', CANVAS_WIDTH - 75, 50);

    platforms.forEach(platform => platform.draw());
    coins.forEach(coin => coin.draw());
    enemies.forEach(enemy => enemy.draw());
    player.draw();
}

// HUD
function updateHUD() {
    document.getElementById('level').textContent = currentLevel;
    document.getElementById('score').textContent = score;
    document.getElementById('coins').textContent = coins.filter(c => c.collected).length + '/' + coins.length;

    const hearts = '❤️'.repeat(lives);
    document.getElementById('lives').textContent = hearts;
}

// LEVEL MANAGEMENT
function completeLevel() {
    levelComplete = true;
    document.getElementById('level-score').textContent = score;

    if (currentLevel >= 3) {
        // All levels complete
        document.getElementById('victory-score').textContent = score;
        document.getElementById('victory').classList.remove('hidden');
    } else {
        document.getElementById('level-complete').classList.remove('hidden');
    }
}

function nextLevel() {
    currentLevel++;
    levelComplete = false;
    document.getElementById('level-complete').classList.add('hidden');
    loadLevel(currentLevel);
    updateHUD();
    gameStarted = true;
}

// GAME STATE
function endGame() {
    gameOver = true;
    document.getElementById('final-level').textContent = currentLevel;
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.remove('hidden');
}

function restart() {
    // Cancel animation loop
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    score = 0;
    lives = 3;
    currentLevel = 1;
    gameStarted = false;
    gameOver = false;
    levelComplete = false;

    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('victory').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');

    player.respawn();
    loadLevel(1);
    updateHUD();
    draw();
}

// INITIALIZATION
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    player = new Player(50, 100);

    loadLevel(1);
    updateHUD();
    draw();

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.getElementById('restart-btn').addEventListener('click', restart);
    document.getElementById('next-level-btn').addEventListener('click', nextLevel);
    document.getElementById('play-again-btn').addEventListener('click', restart);
}

function handleKeyDown(e) {
    keys[e.key] = true;

    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();

        if (!gameStarted && !gameOver) {
            gameStarted = true;
            document.getElementById('start-screen').classList.add('hidden');
            update();
        } else if (gameStarted && !gameOver) {
            player.jump();
        }
    }
}

function handleKeyUp(e) {
    keys[e.key] = false;
}

// START GAME
window.addEventListener('load', init);

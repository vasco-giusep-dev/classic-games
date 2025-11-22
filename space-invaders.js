// CONSTANTS & CONFIGURATION
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 35;
const ALIEN_WIDTH = 40;
const ALIEN_HEIGHT = 30;
const ALIEN_ROWS = 4;
const ALIEN_COLS = 10;
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 15;
const ALIEN_BULLET_HEIGHT = 10;

// GAME STATE
let canvas, ctx;
let player;
let aliens = [];
let bullets = [];
let alienBullets = [];
let score = 0;
let highScore = 0;
let level = 1;
let lives = 3;
let gameStarted = false;
let gameOver = false;
let isPaused = false;
let alienDirection = 1;
let alienSpeed = 1;
let alienMoveCounter = 0;
let alienShootCounter = 0;
let keysPressed = {};

// INITIALIZATION
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    // Load high score
    highScore = parseInt(localStorage.getItem('spaceInvadersHighScore') || '0');
    document.getElementById('high-score').textContent = highScore;

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.getElementById('restart-btn').addEventListener('click', restart);
    document.getElementById('pause-btn').addEventListener('click', togglePause);

    resetGame();
    draw();
}

// GAME SETUP
function resetGame() {
    player = {
        x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
        y: CANVAS_HEIGHT - 80,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        speed: 6
    };

    score = 0;
    level = 1;
    lives = 3;
    gameStarted = false;
    gameOver = false;
    isPaused = false;
    alienSpeed = 1;

    bullets = [];
    alienBullets = [];

    createAliens();
    updateUI();
    updateLives();
}

function createAliens() {
    aliens = [];
    alienDirection = 1;
    const startX = 100;
    const startY = 80;

    for (let row = 0; row < ALIEN_ROWS; row++) {
        for (let col = 0; col < ALIEN_COLS; col++) {
            aliens.push({
                x: startX + col * (ALIEN_WIDTH + 15),
                y: startY + row * (ALIEN_HEIGHT + 15),
                width: ALIEN_WIDTH,
                height: ALIEN_HEIGHT,
                alive: true,
                points: (ALIEN_ROWS - row) * 10
            });
        }
    }
}

function nextLevel() {
    level++;
    alienSpeed += 0.5;
    bullets = [];
    alienBullets = [];
    createAliens();
    updateUI();
}

// GAME LOOP
function update() {
    if (!gameStarted || isPaused || gameOver) {
        requestAnimationFrame(update);
        return;
    }

    // Move player
    if (keysPressed['a'] || keysPressed['arrowleft']) {
        player.x = Math.max(0, player.x - player.speed);
    }
    if (keysPressed['d'] || keysPressed['arrowright']) {
        player.x = Math.min(CANVAS_WIDTH - player.width, player.x + player.speed);
    }

    // Move bullets
    bullets.forEach((bullet, index) => {
        bullet.y -= 8;
        if (bullet.y < 0) {
            bullets.splice(index, 1);
        }
    });

    // Move alien bullets
    alienBullets.forEach((bullet, index) => {
        bullet.y += 4;
        if (bullet.y > CANVAS_HEIGHT) {
            alienBullets.splice(index, 1);
        }

        // Check player hit
        if (bullet.y + ALIEN_BULLET_HEIGHT >= player.y &&
            bullet.x >= player.x &&
            bullet.x <= player.x + player.width) {
            alienBullets.splice(index, 1);
            lives--;
            updateLives();
            if (lives <= 0) {
                endGame();
            }
        }
    });

    // Move aliens
    alienMoveCounter++;
    if (alienMoveCounter >= Math.max(20 - level * 2, 5)) {
        alienMoveCounter = 0;
        moveAliens();
    }

    // Aliens shoot
    alienShootCounter++;
    if (alienShootCounter >= 60) {
        alienShootCounter = 0;
        const aliveAliens = aliens.filter(a => a.alive);
        if (aliveAliens.length > 0 && Math.random() < 0.3) {
            const alien = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
            alienBullets.push({
                x: alien.x + alien.width / 2,
                y: alien.y + alien.height
            });
        }
    }

    // Check bullet collisions
    bullets.forEach((bullet, bIndex) => {
        aliens.forEach(alien => {
            if (alien.alive &&
                bullet.x >= alien.x &&
                bullet.x <= alien.x + alien.width &&
                bullet.y <= alien.y + alien.height &&
                bullet.y >= alien.y) {
                alien.alive = false;
                bullets.splice(bIndex, 1);
                score += alien.points;
                updateUI();

                // Check if all aliens destroyed
                if (aliens.every(a => !a.alive)) {
                    nextLevel();
                }
            }
        });
    });

    draw();
    requestAnimationFrame(update);
}

function moveAliens() {
    let hitEdge = false;

    aliens.forEach(alien => {
        if (!alien.alive) return;

        alien.x += alienDirection * alienSpeed * 10;

        if (alien.x <= 0 || alien.x + alien.width >= CANVAS_WIDTH) {
            hitEdge = true;
        }

        // Check if aliens reached player
        if (alien.y + alien.height >= player.y) {
            endGame();
        }
    });

    if (hitEdge) {
        alienDirection *= -1;
        aliens.forEach(alien => {
            alien.y += 10;
        });
    }
}

// RENDERING
function draw() {
    // Clear canvas
    ctx.fillStyle = 'hsla(180, 30%, 10%, 1)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars
    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`;
        ctx.fillRect(
            Math.random() * CANVAS_WIDTH,
            Math.random() * CANVAS_HEIGHT,
            2, 2
        );
    }

    // Draw player
    const playerGradient = ctx.createLinearGradient(
        player.x, player.y,
        player.x + player.width, player.y + player.height
    );
    playerGradient.addColorStop(0, '#06FFA5');
    playerGradient.addColorStop(1, '#3A86FF');
    ctx.fillStyle = playerGradient;

    // Player ship shape
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFBE0B';
    ctx.fillRect(player.x + player.width / 2 - 3, player.y + player.height, 6, 8);

    // Draw aliens
    aliens.forEach(alien => {
        if (alien.alive) {
            ctx.fillStyle = '#06FFA5';
            ctx.fillRect(alien.x, alien.y, alien.width, alien.height);
            ctx.fill();

            // Alien eyes
            ctx.fillStyle = '#FF006E';
            ctx.beginPath();
            ctx.arc(alien.x + 12, alien.y + 10, 4, 0, Math.PI * 2);
            ctx.arc(alien.x + 28, alien.y + 10, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw bullets
    ctx.fillStyle = '#FFBE0B';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, BULLET_WIDTH, BULLET_HEIGHT);
    });

    ctx.fillStyle = '#FF006E';
    alienBullets.forEach(bullet => {
        ctx.fillRect(bullet.x - 2, bullet.y, 4, ALIEN_BULLET_HEIGHT);
    });
}

// INPUT HANDLING
function handleKeyDown(e) {
    const key = e.key.toLowerCase();

    if (key === ' ') {
        e.preventDefault();
        if (!gameStarted) {
            gameStarted = true;
            document.getElementById('start-screen').classList.add('hidden');
            update();
        } else if (!gameOver) {
            shoot();
        }
    }

    if (key === 'p') {
        togglePause();
    }

    keysPressed[key] = true;
}

function handleKeyUp(e) {
    keysPressed[e.key.toLowerCase()] = false;
}

function shoot() {
    if (bullets.length < 3) {
        bullets.push({
            x: player.x + player.width / 2 - BULLET_WIDTH / 2,
            y: player.y
        });
    }
}

// UI UPDATES
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;

    if (score > highScore) {
        highScore = score;
        document.getElementById('high-score').textContent = highScore;
        localStorage.setItem('spaceInvadersHighScore', highScore);
    }
}

function updateLives() {
    const rockets = document.querySelectorAll('.life');
    rockets.forEach((rocket, index) => {
        if (index >= lives) {
            rocket.classList.add('lost');
        } else {
            rocket.classList.remove('lost');
        }
    });
}

function togglePause() {
    if (!gameStarted || gameOver) return;

    isPaused = !isPaused;
    const btn = document.getElementById('pause-btn');
    btn.textContent = isPaused ? 'Reanudar' : 'Pausar';
}

// GAME STATE MANAGEMENT
function endGame() {
    gameOver = true;
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.remove('hidden');
}

function restart() {
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('pause-btn').textContent = 'Pausar';
    resetGame();
    draw();
}

// START GAME
window.addEventListener('load', init);

// CONSTANTS & CONFIGURATION
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 25;
const BASE_METEOR_SPAWN_RATE = 60; // frames
const MIN_METEOR_SPAWN_RATE = 15; // gets harder over time
const BASE_METEOR_SPEED = 2;
const MAX_SPEED_MULTIPLIER = 5;
const DIFFICULTY_INCREASE_RATE = 0.001; // per frame

// GAME STATE
let canvas, ctx;
let player;
let meteors = [];
let stars = [];
let score = 0;
let highScore = 0;
let time = 0;
let meteorsDodged = 0;
let speedMultiplier = 1;
let gameStarted = false;
let gameOver = false;
let isPaused = false;
let frameCount = 0;
let meteorSpawnCounter = 0;
let keysPressed = {};
let mouseX = CANVAS_WIDTH / 2;
let mouseY = CANVAS_HEIGHT / 2;
let useMouseControl = true;
let animationId = null;

// INITIALIZATION
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    // Load high score
    highScore = parseInt(localStorage.getItem('meteorDodgeHighScore') || '0');
    document.getElementById('high-score').textContent = highScore;

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    document.getElementById('restart-btn').addEventListener('click', restart);
    document.getElementById('pause-btn').addEventListener('click', togglePause);

    createStars();
    resetGame();
}

function createStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 0.5 + 0.2
        });
    }
}

// GAME SETUP
function resetGame() {
    console.log('🔄 RESETGAME LLAMADO - Reseteando todos los valores...');

    // Cancel any existing animation loop
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
        console.log('🛑 Loop de animación anterior cancelado');
    }

    player = {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        size: PLAYER_SIZE,
        speed: 5
    };

    meteors = [];
    score = 0;
    time = 0;
    meteorsDodged = 0;
    frameCount = 0;
    meteorSpawnCounter = 0;
    speedMultiplier = 1;
    gameStarted = false;
    gameOver = false;
    isPaused = false;

    console.log('✅ frameCount reseteado a:', frameCount);
    console.log('✅ speedMultiplier reseteado a:', speedMultiplier);
    console.log('✅ meteoros eliminados:', meteors.length);

    updateUI();
}

// GAME LOOP
function update() {
    if (!gameStarted || isPaused || gameOver) {
        animationId = requestAnimationFrame(update);
        return;
    }

    frameCount++;
    time = (frameCount / 60).toFixed(1);

    // Increase difficulty over time
    speedMultiplier = Math.min(1 + frameCount * DIFFICULTY_INCREASE_RATE, MAX_SPEED_MULTIPLIER);

    // Move player
    if (!useMouseControl) {
        if (keysPressed['w'] || keysPressed['arrowup']) {
            player.y = Math.max(player.size, player.y - player.speed);
        }
        if (keysPressed['s'] || keysPressed['arrowdown']) {
            player.y = Math.min(CANVAS_HEIGHT - player.size, player.y + player.speed);
        }
        if (keysPressed['a'] || keysPressed['arrowleft']) {
            player.x = Math.max(player.size, player.x - player.speed);
        }
        if (keysPressed['d'] || keysPressed['arrowright']) {
            player.x = Math.min(CANVAS_WIDTH - player.size, player.x + player.speed);
        }
    } else {
        // Smooth mouse following
        const dx = mouseX - player.x;
        const dy = mouseY - player.y;
        player.x += dx * 0.15;
        player.y += dy * 0.15;

        // Keep in bounds
        player.x = Math.max(player.size, Math.min(CANVAS_WIDTH - player.size, player.x));
        player.y = Math.max(player.size, Math.min(CANVAS_HEIGHT - player.size, player.y));
    }

    // Spawn meteors
    meteorSpawnCounter++;
    const currentSpawnRate = Math.max(
        MIN_METEOR_SPAWN_RATE,
        BASE_METEOR_SPAWN_RATE / speedMultiplier
    );

    if (meteorSpawnCounter >= currentSpawnRate) {
        meteorSpawnCounter = 0;
        spawnMeteor();
    }

    // Update meteors
    meteors.forEach((meteor, index) => {
        meteor.x += meteor.vx * speedMultiplier;
        meteor.y += meteor.vy * speedMultiplier;
        meteor.rotation += meteor.rotSpeed;

        // Remove off-screen meteors
        if (meteor.x < -50 || meteor.x > CANVAS_WIDTH + 50 ||
            meteor.y < -50 || meteor.y > CANVAS_HEIGHT + 50) {
            meteors.splice(index, 1);
            meteorsDodged++;
            score += Math.floor(10 * speedMultiplier);
        }

        // Check collision
        const dist = Math.hypot(player.x - meteor.x, player.y - meteor.y);
        if (dist < player.size + meteor.size) {
            endGame();
        }
    });

    // Update stars
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > CANVAS_HEIGHT) {
            star.y = 0;
            star.x = Math.random() * CANVAS_WIDTH;
        }
    });

    updateUI();
    draw();
    animationId = requestAnimationFrame(update);
}

function spawnMeteor() {
    const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
    let x, y, vx, vy;
    const speed = BASE_METEOR_SPEED + Math.random() * 2;
    const size = Math.random() * 15 + 15;

    switch (side) {
        case 0: // top
            x = Math.random() * CANVAS_WIDTH;
            y = -30;
            vx = (Math.random() - 0.5) * 4;
            vy = speed;
            break;
        case 1: // right
            x = CANVAS_WIDTH + 30;
            y = Math.random() * CANVAS_HEIGHT;
            vx = -speed;
            vy = (Math.random() - 0.5) * 4;
            break;
        case 2: // bottom
            x = Math.random() * CANVAS_WIDTH;
            y = CANVAS_HEIGHT + 30;
            vx = (Math.random() - 0.5) * 4;
            vy = -speed;
            break;
        case 3: // left
            x = -30;
            y = Math.random() * CANVAS_HEIGHT;
            vx = speed;
            vy = (Math.random() - 0.5) * 4;
            break;
    }

    meteors.push({
        x, y, vx, vy,
        size,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.1
    });
}

// RENDERING
function draw() {
    // Clear canvas
    ctx.fillStyle = '#0a0515';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.size / 3})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw meteors
    meteors.forEach(meteor => {
        ctx.save();
        ctx.translate(meteor.x, meteor.y);
        ctx.rotate(meteor.rotation);

        // Meteor gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, meteor.size);
        gradient.addColorStop(0, '#ff6b35');
        gradient.addColorStop(0.5, '#ff4500');
        gradient.addColorStop(1, '#8b2500');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, meteor.size, 0, Math.PI * 2);
        ctx.fill();

        // Meteor detail
        ctx.fillStyle = '#5a1a00';
        ctx.beginPath();
        ctx.arc(-meteor.size * 0.3, -meteor.size * 0.2, meteor.size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });

    // Draw player ship
    ctx.save();
    ctx.translate(player.x, player.y);

    // Ship body
    const shipGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, player.size);
    shipGradient.addColorStop(0, '#00d4ff');
    shipGradient.addColorStop(0.7, '#0088ff');
    shipGradient.addColorStop(1, '#0044aa');

    ctx.fillStyle = shipGradient;
    ctx.beginPath();
    ctx.arc(0, 0, player.size, 0, Math.PI * 2);
    ctx.fill();

    // Ship triangular nose
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(0, -player.size - 5);
    ctx.lineTo(-8, -player.size + 5);
    ctx.lineTo(8, -player.size + 5);
    ctx.closePath();
    ctx.fill();

    // Ship glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00d4ff';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, player.size, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();
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
        } else {
            togglePause();
        }
    }

    // Switch to keyboard control when keys are pressed
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        useMouseControl = false;
        keysPressed[key] = true;
    }
}

function handleKeyUp(e) {
    keysPressed[e.key.toLowerCase()] = false;
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    useMouseControl = true;
}

// UI UPDATES
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('time').textContent = time + 's';
    document.getElementById('meteors-dodged').textContent = meteorsDodged;
    document.getElementById('speed-mult').textContent = speedMultiplier.toFixed(1) + 'x';

    if (score > highScore) {
        highScore = score;
        document.getElementById('high-score').textContent = highScore;
        localStorage.setItem('meteorDodgeHighScore', highScore);
    }
}

function togglePause() {
    if (!gameStarted || gameOver) return;

    isPaused = !isPaused;
    const btn = document.getElementById('pause-btn');
    btn.textContent = isPaused ? 'Reanudar' : 'Pausar';

    if (!isPaused) {
        update();
    }
}

// GAME STATE MANAGEMENT
function endGame() {
    gameOver = true;
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-time').textContent = time + 's';
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

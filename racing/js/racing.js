// CONSTANTS & CONFIGURATION
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const CAR_WIDTH = 30;
const CAR_HEIGHT = 50;
const MAX_SPEED = 5;
const ACCELERATION = 0.3;
const FRICTION = 0.95;
const TURN_SPEED = 0.08;
const TOTAL_LAPS = 3;

// Track configuration
const TRACK_OUTER_WIDTH = 700;
const TRACK_OUTER_HEIGHT = 500;
const TRACK_INNER_WIDTH = 400;
const TRACK_INNER_HEIGHT = 250;
const TRACK_X = (CANVAS_WIDTH - TRACK_OUTER_WIDTH) / 2;
const TRACK_Y = (CANVAS_HEIGHT - TRACK_OUTER_HEIGHT) / 2;

// Finish line
const FINISH_LINE_X = TRACK_X + TRACK_OUTER_WIDTH / 2;
const FINISH_LINE_Y = TRACK_Y;
const FINISH_LINE_WIDTH = 80;

// GAME STATE
let canvas, ctx;
let player1, player2;
let gameStarted = false;
let gameOver = false;
let isPaused = false;
let keysPressed = {};
let winner = null;

// INITIALIZATION
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

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
    player1 = {
        x: FINISH_LINE_X - 40,
        y: FINISH_LINE_Y + 30,
        angle: Math.PI / 2, // Facing down
        speed: 0,
        color: '#FF3366',
        laps: 0,
        passedCheckpoint: false,
        controls: {
            up: 'arrowup',
            down: 'arrowdown',
            left: 'arrowleft',
            right: 'arrowright'
        }
    };

    player2 = {
        x: FINISH_LINE_X + 40,
        y: FINISH_LINE_Y + 30,
        angle: Math.PI / 2, // Facing down
        speed: 0,
        color: '#3388FF',
        laps: 0,
        passedCheckpoint: false,
        controls: {
            up: 'w',
            down: 's',
            left: 'a',
            right: 'd'
        }
    };

    gameStarted = false;
    gameOver = false;
    isPaused = false;
    winner = null;

    updateLapDisplay();
}

// GAME LOOP
function update() {
    if (!gameStarted || isPaused || gameOver) {
        requestAnimationFrame(update);
        return;
    }

    updatePlayer(player1);
    updatePlayer(player2);

    // Check for track boundaries
    keepOnTrack(player1);
    keepOnTrack(player2);

    // Check lap progress
    checkLapProgress(player1);
    checkLapProgress(player2);

    // Check for winner
    if (player1.laps >= TOTAL_LAPS && !gameOver) {
        endGame(1);
    } else if (player2.laps >= TOTAL_LAPS && !gameOver) {
        endGame(2);
    }

    draw();
    requestAnimationFrame(update);
}

function updatePlayer(player) {
    // Acceleration
    if (keysPressed[player.controls.up]) {
        player.speed += ACCELERATION;
    }
    if (keysPressed[player.controls.down]) {
        player.speed -= ACCELERATION * 0.6;
    }

    // Apply friction
    player.speed *= FRICTION;

    // Limit speed
    player.speed = Math.max(-MAX_SPEED * 0.5, Math.min(MAX_SPEED, player.speed));

    // Turning
    if (player.speed !== 0) {
        if (keysPressed[player.controls.left]) {
            player.angle -= TURN_SPEED * (player.speed / MAX_SPEED);
        }
        if (keysPressed[player.controls.right]) {
            player.angle += TURN_SPEED * (player.speed / MAX_SPEED);
        }
    }

    // Movement
    player.x += Math.cos(player.angle) * player.speed;
    player.y += Math.sin(player.angle) * player.speed;
}

function keepOnTrack(player) {
    const centerX = TRACK_X + TRACK_OUTER_WIDTH / 2;
    const centerY = TRACK_Y + TRACK_OUTER_HEIGHT / 2;

    // Check if outside outer boundary
    const outerLeft = TRACK_X;
    const outerRight = TRACK_X + TRACK_OUTER_WIDTH;
    const outerTop = TRACK_Y;
    const outerBottom = TRACK_Y + TRACK_OUTER_HEIGHT;

    // Check if inside inner boundary
    const innerLeft = TRACK_X + (TRACK_OUTER_WIDTH - TRACK_INNER_WIDTH) / 2;
    const innerRight = innerLeft + TRACK_INNER_WIDTH;
    const innerTop = TRACK_Y + (TRACK_OUTER_HEIGHT - TRACK_INNER_HEIGHT) / 2;
    const innerBottom = innerTop + TRACK_INNER_HEIGHT;

    let offTrack = false;

    // Outside outer bounds
    if (player.x < outerLeft || player.x > outerRight ||
        player.y < outerTop || player.y > outerBottom) {
        offTrack = true;
    }

    // Inside inner rectangle
    if (player.x > innerLeft && player.x < innerRight &&
        player.y > innerTop && player.y < innerBottom) {
        offTrack = true;
    }

    if (offTrack) {
        player.speed *= 0.5; // Slow down when off track
    }
}

function checkLapProgress(player) {
    const centerX = TRACK_X + TRACK_OUTER_WIDTH / 2;
    const checkpointY = TRACK_Y + TRACK_OUTER_HEIGHT;

    // Check if passed checkpoint (bottom of track)
    if (player.y > checkpointY - 50 && !player.passedCheckpoint) {
        player.passedCheckpoint = true;
    }

    // Check if crossed finish line from the right direction
    if (player.passedCheckpoint &&
        player.y < FINISH_LINE_Y + 50 &&
        player.x > FINISH_LINE_X - FINISH_LINE_WIDTH / 2 &&
        player.x < FINISH_LINE_X + FINISH_LINE_WIDTH / 2) {
        player.laps++;
        player.passedCheckpoint = false;
        updateLapDisplay();
    }
}

// RENDERING
function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grass background
    ctx.fillStyle = '#2d4a2d';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw outer track
    ctx.fillStyle = '#404040';
    ctx.fillRect(TRACK_X, TRACK_Y, TRACK_OUTER_WIDTH, TRACK_OUTER_HEIGHT);

    // Draw track markings (outer)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
    ctx.strokeRect(TRACK_X + 15, TRACK_Y + 15, TRACK_OUTER_WIDTH - 30, TRACK_OUTER_HEIGHT - 30);

    // Draw inner grass
    const innerX = TRACK_X + (TRACK_OUTER_WIDTH - TRACK_INNER_WIDTH) / 2;
    const innerY = TRACK_Y + (TRACK_OUTER_HEIGHT - TRACK_INNER_HEIGHT) / 2;
    ctx.fillStyle = '#2d4a2d';
    ctx.fillRect(innerX, innerY, TRACK_INNER_WIDTH, TRACK_INNER_HEIGHT);

    // Draw inner track border
    ctx.strokeStyle = '#FFFFFF';
    ctx.strokeRect(innerX - 15, innerY - 15, TRACK_INNER_WIDTH + 30, TRACK_INNER_HEIGHT + 30);
    ctx.setLineDash([]);

    // Draw finish line
    const finishX = FINISH_LINE_X - FINISH_LINE_WIDTH / 2;
    const finishY = FINISH_LINE_Y;

    // Checkered pattern
    const squareSize = 10;
    for (let i = 0; i < FINISH_LINE_WIDTH / squareSize; i++) {
        for (let j = 0; j < 3; j++) {
            if ((i + j) % 2 === 0) {
                ctx.fillStyle = '#FFFFFF';
            } else {
                ctx.fillStyle = '#000000';
            }
            ctx.fillRect(
                finishX + i * squareSize,
                finishY + j * squareSize,
                squareSize,
                squareSize
            );
        }
    }

    // Draw finish line text
    ctx.fillStyle = '#FFEB3B';
    ctx.font = 'bold 16px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('START/FINISH', FINISH_LINE_X, FINISH_LINE_Y - 10);

    // Draw cars
    drawCar(player1);
    drawCar(player2);
}

function drawCar(player) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Car body
    ctx.fillStyle = player.color;
    ctx.fillRect(-CAR_WIDTH / 2, -CAR_HEIGHT / 2, CAR_WIDTH, CAR_HEIGHT);

    // Car windows
    ctx.fillStyle = 'rgba(100, 150, 255, 0.6)';
    ctx.fillRect(-CAR_WIDTH / 2 + 5, -CAR_HEIGHT / 2 + 10, CAR_WIDTH - 10, 15);

    // Car highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-CAR_WIDTH / 2, -CAR_HEIGHT / 2, CAR_WIDTH, CAR_HEIGHT);

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

    keysPressed[key] = true;
}

function handleKeyUp(e) {
    keysPressed[e.key.toLowerCase()] = false;
}

// UI UPDATES
function updateLapDisplay() {
    document.getElementById('player1-laps').textContent = `${player1.laps} / ${TOTAL_LAPS}`;
    document.getElementById('player2-laps').textContent = `${player2.laps} / ${TOTAL_LAPS}`;
}

function togglePause() {
    if (!gameStarted || gameOver) return;

    isPaused = !isPaused;
    const btn = document.getElementById('pause-btn');
    btn.textContent = isPaused ? 'Reanudar' : 'Pausar';
}

// GAME STATE MANAGEMENT
function endGame(winnerNumber) {
    gameOver = true;
    winner = winnerNumber;
    document.getElementById('winner-text').textContent = `¡Jugador ${winnerNumber} Gana!`;
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

// CONSTANTS & CONFIGURATION
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 120;
const PADDLE_HEIGHT = 20;
const BALL_RADIUS = 8;
const BRICK_ROWS = 6;
const BRICK_COLS = 10;
const BRICK_WIDTH = 65;
const BRICK_HEIGHT = 22;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 80;
const BRICK_OFFSET_LEFT = 28;

const BRICK_COLORS = [
    '#FF006E', // Red
    '#FB5607', // Orange
    '#FFBE0B', // Yellow
    '#06FFA5', // Cyan
    '#3A86FF', // Blue
    '#8338EC'  // Purple
];

const BRICK_POINTS = [60, 50, 40, 30, 20, 10];

// GAME STATE
let canvas, ctx;
let paddle, ball, bricks = [];
let score = 0;
let level = 1;
let lives = 3;
let gameStarted = false;
let gameOver = false;
let isPaused = false;
let ballLaunched = false;
let keysPressed = {};

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
    paddle = {
        x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
        y: CANVAS_HEIGHT - 50,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        speed: 8
    };

    ball = {
        x: CANVAS_WIDTH / 2,
        y: paddle.y - BALL_RADIUS,
        radius: BALL_RADIUS,
        speedX: 0,
        speedY: 0,
        speed: 5
    };

    score = 0;
    level = 1;
    lives = 3;
    gameStarted = false;
    gameOver = false;
    isPaused = false;
    ballLaunched = false;

    createBricks();
    updateUI();
}

function createBricks() {
    bricks = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
            bricks.push({
                x: col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
                y: row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP,
                width: BRICK_WIDTH,
                height: BRICK_HEIGHT,
                color: BRICK_COLORS[row],
                points: BRICK_POINTS[row],
                visible: true
            });
        }
    }
    updateBlocksRemaining();
}

function nextLevel() {
    level++;
    ballLaunched = false;
    ball.speed += 1;
    paddle.width = Math.max(80, paddle.width - 10);

    ball.x = CANVAS_WIDTH / 2;
    ball.y = paddle.y - BALL_RADIUS;
    ball.speedX = 0;
    ball.speedY = 0;

    createBricks();
    updateUI();
}

// GAME LOOP
function update() {
    if (!gameStarted || isPaused || gameOver) {
        requestAnimationFrame(update);
        return;
    }

    // Move paddle
    if (keysPressed['a'] || keysPressed['arrowleft']) {
        paddle.x = Math.max(0, paddle.x - paddle.speed);
    }
    if (keysPressed['d'] || keysPressed['arrowright']) {
        paddle.x = Math.min(CANVAS_WIDTH - paddle.width, paddle.x + paddle.speed);
    }

    // Ball follows paddle if not launched
    if (!ballLaunched) {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - BALL_RADIUS;
    } else {
        // Move ball
        ball.x += ball.speedX;
        ball.y += ball.speedY;

        // Wall collision
        if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= CANVAS_WIDTH) {
            ball.speedX *= -1;
        }
        if (ball.y - ball.radius <= 0) {
            ball.speedY *= -1;
        }

        // Paddle collision
        if (ball.y + ball.radius >= paddle.y &&
            ball.x >= paddle.x &&
            ball.x <= paddle.x + paddle.width &&
            ball.speedY > 0) {

            // Calculate bounce angle based on where ball hit paddle
            const hitPos = (ball.x - paddle.x) / paddle.width;
            const angle = (hitPos - 0.5) * Math.PI * 0.6;

            ball.speedX = ball.speed * Math.sin(angle);
            ball.speedY = -ball.speed * Math.cos(angle);
        }

        // Brick collision
        bricks.forEach(brick => {
            if (brick.visible && checkBrickCollision(ball, brick)) {
                brick.visible = false;
                score += brick.points;
                ball.speedY *= -1;
                updateUI();
                updateBlocksRemaining();

                // Check win
                if (bricks.every(b => !b.visible)) {
                    nextLevel();
                }
            }
        });

        // Ball out of bounds
        if (ball.y - ball.radius > CANVAS_HEIGHT) {
            lives--;
            updateLives();

            if (lives <= 0) {
                endGame(false);
            } else {
                ballLaunched = false;
                ball.x = paddle.x + paddle.width / 2;
                ball.y = paddle.y - BALL_RADIUS;
                ball.speedX = 0;
                ball.speedY = 0;
            }
        }
    }

    draw();
    requestAnimationFrame(update);
}

function checkBrickCollision(ball, brick) {
    return ball.x + ball.radius > brick.x &&
        ball.x - ball.radius < brick.x + brick.width &&
        ball.y + ball.radius > brick.y &&
        ball.y - ball.radius < brick.y + brick.height;
}

// RENDERING
function draw() {
    // Clear canvas
    ctx.fillStyle = 'hsla(45, 30%, 10%, 1)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw bricks
    bricks.forEach(brick => {
        if (brick.visible) {
            const gradient = ctx.createLinearGradient(
                brick.x, brick.y,
                brick.x + brick.width, brick.y + brick.height
            );
            gradient.addColorStop(0, brick.color);
            gradient.addColorStop(1, adjustBrightness(brick.color, -20));

            ctx.fillStyle = gradient;
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

            // Brick highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(brick.x + 2, brick.y + 2, brick.width - 4, brick.height - 4);
        }
    });

    // Draw paddle
    const paddleGradient = ctx.createLinearGradient(
        paddle.x, paddle.y,
        paddle.x + paddle.width, paddle.y + paddle.height
    );
    paddleGradient.addColorStop(0, '#FFBE0B');
    paddleGradient.addColorStop(0.5, '#FB5607');
    paddleGradient.addColorStop(1, '#FFBE0B');
    ctx.fillStyle = paddleGradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Paddle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Draw ball
    const ballGradient = ctx.createRadialGradient(
        ball.x, ball.y, 0,
        ball.x, ball.y, ball.radius
    );
    ballGradient.addColorStop(0, '#FFFFFF');
    ballGradient.addColorStop(0.3, '#FFBE0B');
    ballGradient.addColorStop(1, '#FF006E');
    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Ball glow
    ctx.fillStyle = 'rgba(255, 190, 11, 0.4)';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius * 2, 0, Math.PI * 2);
    ctx.fill();
}

function adjustBrightness(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `rgb(${r}, ${g}, ${b})`;
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
        } else if (!ballLaunched) {
            launchBall();
        } else {
            togglePause();
        }
    }

    keysPressed[key] = true;
}

function handleKeyUp(e) {
    keysPressed[e.key.toLowerCase()] = false;
}

function launchBall() {
    ballLaunched = true;
    const angle = (Math.random() * 0.6 - 0.3) * Math.PI;
    ball.speedX = ball.speed * Math.sin(angle);
    ball.speedY = -ball.speed * Math.cos(angle);
}

// UI UPDATES
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
}

function updateLives() {
    const hearts = document.querySelectorAll('.heart');
    hearts.forEach((heart, index) => {
        if (index >= lives) {
            heart.classList.add('lost');
        } else {
            heart.classList.remove('lost');
        }
    });
}

function updateBlocksRemaining() {
    const remaining = bricks.filter(b => b.visible).length;
    document.getElementById('blocks-remaining').textContent = remaining;
}

function togglePause() {
    if (!gameStarted || gameOver) return;

    isPaused = !isPaused;
    const btn = document.getElementById('pause-btn');
    btn.textContent = isPaused ? 'Reanudar' : 'Pausar';
}

// GAME STATE MANAGEMENT
function endGame(won) {
    gameOver = true;
    document.getElementById('result-text').textContent = won ? '¡Ganaste!' : 'Game Over';
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

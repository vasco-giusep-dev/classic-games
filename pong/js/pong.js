// CONSTANTS & CONFIGURATION
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 15;
const WINNING_SCORE = 5;

const DIFFICULTY = {
    easy: { speed: 3, cpuSpeed: 2 },
    medium: { speed: 5, cpuSpeed: 3.5 },
    hard: { speed: 7, cpuSpeed: 5 }
};

// GAME STATE
let canvas, ctx;
let playerPaddle, cpuPaddle, balls;
let playerScore = 0;
let cpuScore = 0;
let gameStarted = false;
let gameOver = false;
let isPaused = false;
let difficulty = 'medium';
let keysPressed = {};

// INITIALIZATION
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.getElementById('restart-btn').addEventListener('click', restart);
    document.getElementById('difficulty').addEventListener('change', handleDifficultyChange);

    resetGame();
    draw();
}

// GAME SETUP
function resetGame() {
    playerPaddle = {
        x: 30,
        y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        speed: 6
    };

    cpuPaddle = {
        x: CANVAS_WIDTH - 30 - PADDLE_WIDTH,
        y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT
    };

    resetBall();

    playerScore = 0;
    cpuScore = 0;
    gameStarted = false;
    gameOver = false;
    isPaused = false;

    updateScores();
}

function resetBall() {
    const config = DIFFICULTY[difficulty];
    balls = [];

    // En modo difícil, crear 3 pelotas
    const numBalls = difficulty === 'hard' ? 3 : 1;

    for (let i = 0; i < numBalls; i++) {
        balls.push({
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT / 2 + (i * 50) - 50, // Distribuir verticalmente
            size: BALL_SIZE,
            speedX: config.speed * (Math.random() > 0.5 ? 1 : -1),
            speedY: config.speed * (Math.random() * 0.5 + 0.5) * (Math.random() > 0.5 ? 1 : -1)
        });
    }
}

// GAME LOOP
function update() {
    if (!gameStarted || isPaused || gameOver) {
        requestAnimationFrame(update);
        return;
    }

    // Move player paddle
    if (keysPressed['w'] && playerPaddle.y > 0) {
        playerPaddle.y -= playerPaddle.speed;
    }
    if (keysPressed['s'] && playerPaddle.y < CANVAS_HEIGHT - playerPaddle.height) {
        playerPaddle.y += playerPaddle.speed;
    }

    // Move CPU paddle (AI) - seguir la pelota más cercana
    const config = DIFFICULTY[difficulty];
    const paddleCenter = cpuPaddle.y + cpuPaddle.height / 2;

    // Encontrar la pelota más cercana a la CPU
    let closestBall = balls[0];
    let closestDistance = Math.abs(balls[0].x - cpuPaddle.x);

    balls.forEach(ball => {
        const distance = Math.abs(ball.x - cpuPaddle.x);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestBall = ball;
        }
    });

    const ballCenter = closestBall.y + closestBall.size / 2;

    if (paddleCenter < ballCenter - 10) {
        cpuPaddle.y += config.cpuSpeed;
    } else if (paddleCenter > ballCenter + 10) {
        cpuPaddle.y -= config.cpuSpeed;
    }

    // Keep CPU paddle in bounds
    cpuPaddle.y = Math.max(0, Math.min(CANVAS_HEIGHT - cpuPaddle.height, cpuPaddle.y));

    // Procesar cada pelota
    balls.forEach((ball, index) => {
        // Move ball
        ball.x += ball.speedX;
        ball.y += ball.speedY;

        // Ball collision with top/bottom
        if (ball.y <= 0 || ball.y + ball.size >= CANVAS_HEIGHT) {
            ball.speedY *= -1;
        }

        // Ball collision with paddles
        if (checkPaddleCollision(ball, playerPaddle) || checkPaddleCollision(ball, cpuPaddle)) {
            ball.speedX *= -1.05; // Increase speed slightly

            // Add spin based on where ball hit paddle
            const paddle = ball.x < CANVAS_WIDTH / 2 ? playerPaddle : cpuPaddle;
            const hitPos = (ball.y - paddle.y) / paddle.height;
            ball.speedY = (hitPos - 0.5) * 10;
        }

        // Score points
        if (ball.x < 0) {
            cpuScore++;
            updateScores();
            checkWin();
            balls.splice(index, 1); // Remover esta pelota
            // Si no quedan pelotas, resetear
            if (balls.length === 0) {
                setTimeout(resetBall, 500);
            }
        } else if (ball.x > CANVAS_WIDTH) {
            playerScore++;
            updateScores();
            checkWin();
            balls.splice(index, 1); // Remover esta pelota
            // Si no quedan pelotas, resetear
            if (balls.length === 0) {
                setTimeout(resetBall, 500);
            }
        }
    });

    draw();
    requestAnimationFrame(update);
}

function checkPaddleCollision(ball, paddle) {
    return ball.x < paddle.x + paddle.width &&
        ball.x + ball.size > paddle.x &&
        ball.y < paddle.y + paddle.height &&
        ball.y + ball.size > paddle.y;
}

function checkWin() {
    if (playerScore >= WINNING_SCORE) {
        endGame('¡Ganaste!');
    } else if (cpuScore >= WINNING_SCORE) {
        endGame('¡CPU Gana!');
    }
}

// RENDERING
function draw() {
    // Clear canvas
    ctx.fillStyle = 'hsla(25, 30%, 10%, 1)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw middle line
    ctx.strokeStyle = 'rgba(251, 86, 7, 0.3)';
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 15]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    const playerGradient = ctx.createLinearGradient(
        playerPaddle.x, playerPaddle.y,
        playerPaddle.x + playerPaddle.width, playerPaddle.y + playerPaddle.height
    );
    playerGradient.addColorStop(0, '#FB5607');
    playerGradient.addColorStop(1, '#FFBE0B');
    ctx.fillStyle = playerGradient;
    ctx.fillRect(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height);

    const cpuGradient = ctx.createLinearGradient(
        cpuPaddle.x, cpuPaddle.y,
        cpuPaddle.x + cpuPaddle.width, cpuPaddle.y + cpuPaddle.height
    );
    cpuGradient.addColorStop(0, '#FB5607');
    cpuGradient.addColorStop(1, '#FFBE0B');
    ctx.fillStyle = cpuGradient;
    ctx.fillRect(cpuPaddle.x, cpuPaddle.y, cpuPaddle.width, cpuPaddle.height);

    // Draw balls
    balls.forEach(ball => {
        const ballGradient = ctx.createRadialGradient(
            ball.x + ball.size / 2, ball.y + ball.size / 2, 0,
            ball.x + ball.size / 2, ball.y + ball.size / 2, ball.size
        );
        ballGradient.addColorStop(0, '#FFBE0B');
        ballGradient.addColorStop(1, '#FB5607');
        ctx.fillStyle = ballGradient;
        ctx.beginPath();
        ctx.arc(ball.x + ball.size / 2, ball.y + ball.size / 2, ball.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw ball glow
        ctx.fillStyle = 'rgba(255, 190, 11, 0.3)';
        ctx.beginPath();
        ctx.arc(ball.x + ball.size / 2, ball.y + ball.size / 2, ball.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// INPUT HANDLING
function handleKeyDown(e) {
    if (e.key === ' ') {
        e.preventDefault();
        if (!gameStarted) {
            gameStarted = true;
            document.getElementById('start-screen').classList.add('hidden');
            update();
        } else {
            isPaused = !isPaused;
        }
    }

    keysPressed[e.key.toLowerCase()] = true;
}

function handleKeyUp(e) {
    keysPressed[e.key.toLowerCase()] = false;
}

function handleDifficultyChange(e) {
    difficulty = e.target.value;
    if (!gameStarted) {
        resetBall();
    }
}

// UI UPDATES
function updateScores() {
    document.getElementById('player-score').textContent = playerScore;
    document.getElementById('cpu-score').textContent = cpuScore;
}

// GAME STATE MANAGEMENT
function endGame(message) {
    gameOver = true;
    document.getElementById('winner-text').textContent = message;
    document.getElementById('game-over').classList.remove('hidden');
}

function restart() {
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    resetGame();
    draw();
}

// START GAME
window.addEventListener('load', init);

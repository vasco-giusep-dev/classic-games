// ========================================
// CONSTANTS & CONFIGURATION
// ========================================
const GRID_SIZE = 30;
const CELL_SIZE = 20;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 5;

const COLORS = {
    snake: '#06FFA5',
    snakeHead: '#00FF88',
    food: '#FF006E',
    grid: 'rgba(255, 255, 255, 0.05)'
};

const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// ========================================
// GAME STATE
// ========================================
let canvas, ctx;
let snake = [];
let direction = DIRECTIONS.RIGHT;
let nextDirection = DIRECTIONS.RIGHT;
let food = { x: 0, y: 0 };
let score = 0;
let highScore = 0;
let gameLoop = null;
let gameSpeed = INITIAL_SPEED;
let isPaused = false;
let gameStarted = false;
let gameOver = false;

// ========================================
// INITIALIZATION
// ========================================
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    // Load high score
    highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
    document.getElementById('high-score').textContent = highScore;

    // Event listeners
    document.addEventListener('keydown', handleKeyPress);
    document.getElementById('restart-btn').addEventListener('click', restart);
    document.getElementById('pause-btn').addEventListener('click', togglePause);

    // Initialize game
    resetGame();
    draw();
}

// ========================================
// GAME SETUP
// ========================================
function resetGame() {
    // Reset snake in the middle
    const midX = Math.floor(GRID_SIZE / 2);
    const midY = Math.floor(GRID_SIZE / 2);

    snake = [
        { x: midX, y: midY },
        { x: midX - 1, y: midY },
        { x: midX - 2, y: midY }
    ];

    direction = DIRECTIONS.RIGHT;
    nextDirection = DIRECTIONS.RIGHT;
    score = 0;
    gameSpeed = INITIAL_SPEED;
    isPaused = false;
    gameStarted = false;
    gameOver = false;

    spawnFood();
    updateUI();

    // Show start screen
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('game-over').classList.add('hidden');
}

function spawnFood() {
    do {
        food = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

// ========================================
// GAME LOOP
// ========================================
function startGame() {
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, gameSpeed);
}

function update() {
    if (isPaused || !gameStarted || gameOver) return;

    // Update direction
    direction = nextDirection;

    // Calculate new head position
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;

    // Check collisions
    if (checkCollision(head)) {
        endGame();
        return;
    }

    // Add new head
    snake.unshift(head);

    // Check if food eaten
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        updateUI();
        spawnFood();

        // Increase speed
        if (score % 50 === 0 && gameSpeed > 50) {
            gameSpeed = Math.max(50, gameSpeed - SPEED_INCREMENT);
            startGame(); // Restart with new speed
        }
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }

    draw();
}

// ========================================
// COLLISION DETECTION
// ========================================
function checkCollision(head) {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        return true;
    }

    // Self collision
    return snake.some(segment => segment.x === head.x && segment.y === head.y);
}

// ========================================
// RENDERING
// ========================================
function draw() {
    // Clear canvas
    ctx.fillStyle = 'hsla(140, 30%, 10%, 1)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
        ctx.stroke();
    }

    // Draw food with pulsing effect
    const foodX = food.x * CELL_SIZE;
    const foodY = food.y * CELL_SIZE;

    // Outer glow
    const gradient = ctx.createRadialGradient(
        foodX + CELL_SIZE / 2, foodY + CELL_SIZE / 2, 0,
        foodX + CELL_SIZE / 2, foodY + CELL_SIZE / 2, CELL_SIZE
    );
    gradient.addColorStop(0, COLORS.food);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(foodX - 5, foodY - 5, CELL_SIZE + 10, CELL_SIZE + 10);

    // Food
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.arc(foodX + CELL_SIZE / 2, foodY + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Inner highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(foodX + CELL_SIZE / 2 - 3, foodY + CELL_SIZE / 2 - 3, CELL_SIZE / 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw snake
    snake.forEach((segment, index) => {
        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;

        // Determine color (head is brighter)
        const color = index === 0 ? COLORS.snakeHead : COLORS.snake;

        // Main segment with gradient
        const segmentGradient = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
        segmentGradient.addColorStop(0, color);
        segmentGradient.addColorStop(1, 'rgba(6, 255, 165, 0.7)');
        ctx.fillStyle = segmentGradient;

        // Rounded rectangle
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 4);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Highlight
        if (index === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.roundRect(x + 3, y + 3, CELL_SIZE / 2, CELL_SIZE / 2, 2);
            ctx.fill();
        }
    });
}

// ========================================
// INPUT HANDLING
// ========================================
function handleKeyPress(e) {
    // Start game on first arrow key press or WASD
    if (!gameStarted && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(e.key)) {
        gameStarted = true;
        document.getElementById('start-screen').classList.add('hidden');
        startGame();
    }

    if (gameOver) return;

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction !== DIRECTIONS.DOWN) {
                nextDirection = DIRECTIONS.UP;
            }
            e.preventDefault();
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction !== DIRECTIONS.UP) {
                nextDirection = DIRECTIONS.DOWN;
            }
            e.preventDefault();
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction !== DIRECTIONS.RIGHT) {
                nextDirection = DIRECTIONS.LEFT;
            }
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction !== DIRECTIONS.LEFT) {
                nextDirection = DIRECTIONS.RIGHT;
            }
            e.preventDefault();
            break;
        case ' ':
            e.preventDefault();
            togglePause();
            break;
    }
}

// ========================================
// UI UPDATES
// ========================================
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('length').textContent = snake.length;

    const speedMultiplier = ((INITIAL_SPEED - gameSpeed) / SPEED_INCREMENT + 1).toFixed(1);
    document.getElementById('speed').textContent = speedMultiplier + 'x';

    // Update high score
    if (score > highScore) {
        highScore = score;
        document.getElementById('high-score').textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
    }
}

function togglePause() {
    if (!gameStarted || gameOver) return;

    isPaused = !isPaused;
    const btn = document.getElementById('pause-btn');
    btn.textContent = isPaused ? 'Reanudar' : 'Pausar';
}

// ========================================
// GAME STATE MANAGEMENT
// ========================================
function endGame() {
    gameOver = true;
    clearInterval(gameLoop);

    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.remove('hidden');
}

function restart() {
    clearInterval(gameLoop);
    resetGame();
    draw();
}

// ========================================
// POLYFILL FOR ROUNDED RECT
// ========================================
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
    };
}

// ========================================
// START GAME
// ========================================
window.addEventListener('load', init);

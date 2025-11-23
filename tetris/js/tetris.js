// ========================================
// CONSTANTS & CONFIGURATION
// ========================================
const COLS = 10;
const ROWS = 20;
let BLOCK_SIZE = 30; // Dynamic, calculated based on canvas size
const COLORS = [
    null,
    '#FF006E', // I - Pink
    '#8338EC', // J - Purple
    '#3A86FF', // L - Blue
    '#FFBE0B', // O - Yellow
    '#06FFA5', // S - Cyan
    '#FB5607', // T - Orange
    '#FF006E'  // Z - Red
];

// Tetrimino shapes
const SHAPES = [
    [],
    [[1, 1, 1, 1]], // I
    [[2, 0, 0], [2, 2, 2]], // J
    [[0, 0, 3], [3, 3, 3]], // L
    [[4, 4], [4, 4]], // O
    [[0, 5, 5], [5, 5, 0]], // S
    [[0, 6, 0], [6, 6, 6]], // T
    [[7, 7, 0], [0, 7, 7]]  // Z
];

const POINTS = {
    SINGLE: 100,
    DOUBLE: 300,
    TRIPLE: 500,
    TETRIS: 800,
    SOFT_DROP: 1,
    HARD_DROP: 2
};

// ========================================
// GAME STATE
// ========================================
let canvas, ctx, nextCanvas, nextCtx;
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameOver = false;
let isPaused = false;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

// ========================================
// INITIALIZATION
// ========================================
function init() {
    canvas = document.getElementById('tetris-canvas');
    ctx = canvas.getContext('2d');
    nextCanvas = document.getElementById('next-canvas');
    nextCtx = nextCanvas.getContext('2d');

    // Initialize board
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

    // Setup responsive canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Event listeners
    document.addEventListener('keydown', handleKeyPress);
    document.getElementById('restart-btn').addEventListener('click', restart);
    document.getElementById('pause-btn').addEventListener('click', togglePause);

    // Initialize touch controls for mobile devices
    initTouchControls();

    // Start game
    nextPiece = createPiece();
    spawnPiece();
    update();
}

// ========================================
// RESPONSIVE CANVAS SIZING
// ========================================
function resizeCanvas() {
    const container = document.querySelector('.main-game');
    const maxWidth = Math.min(window.innerWidth - 40, 400);
    const maxHeight = Math.min(window.innerHeight - 200, 800);

    // Calculate canvas size maintaining 1:2 aspect ratio
    let canvasWidth, canvasHeight;

    if (window.innerWidth <= 768) {
        // Mobile: use most of the width
        canvasWidth = Math.min(maxWidth, window.innerWidth * 0.9);
        canvasHeight = canvasWidth * 2;

        // Adjust if height is too large
        if (canvasHeight > maxHeight) {
            canvasHeight = maxHeight;
            canvasWidth = canvasHeight / 2;
        }
    } else {
        // Desktop: use fixed comfortable size
        canvasWidth = 300;
        canvasHeight = 600;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    BLOCK_SIZE = canvasWidth / COLS;

    // Redraw if game is active
    if (currentPiece) {
        draw();
        drawNext();
    }
}

// ========================================
// TOUCH CONTROLS
// ========================================
function initTouchControls() {
    // Check if device supports touch
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice) {
        const controlsContainer = document.getElementById('mobile-controls');
        if (controlsContainer) {
            controlsContainer.style.display = 'flex';

            // Add touch event listeners
            document.getElementById('btn-left').addEventListener('touchstart', (e) => {
                e.preventDefault();
                move(-1);
                draw();
            });

            document.getElementById('btn-right').addEventListener('touchstart', (e) => {
                e.preventDefault();
                move(1);
                draw();
            });

            document.getElementById('btn-rotate').addEventListener('touchstart', (e) => {
                e.preventDefault();
                rotate();
                draw();
            });

            document.getElementById('btn-down').addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (drop()) {
                    score += POINTS.SOFT_DROP;
                    updateScore();
                }
                dropCounter = 0;
                draw();
            });

            document.getElementById('btn-drop').addEventListener('touchstart', (e) => {
                e.preventDefault();
                hardDrop();
            });
        }
    }
}

// ========================================
// PIECE MANAGEMENT
// ========================================
function createPiece() {
    const type = Math.floor(Math.random() * 7) + 1;
    return {
        shape: SHAPES[type],
        color: type,
        x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2),
        y: 0
    };
}

function spawnPiece() {
    currentPiece = nextPiece;
    nextPiece = createPiece();

    if (collision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        endGame();
    }

    drawNext();
}

function drawNext() {
    nextCtx.fillStyle = 'hsla(240, 20%, 10%, 0.5)';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    const shape = nextPiece.shape;
    const blockSize = 25;
    const offsetX = (nextCanvas.width - shape[0].length * blockSize) / 2;
    const offsetY = (nextCanvas.height - shape.length * blockSize) / 2;

    shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(nextCtx, x * blockSize + offsetX, y * blockSize + offsetY, blockSize, COLORS[value]);
            }
        });
    });
}

function drawBlock(context, x, y, size, color) {
    // Main block
    context.fillStyle = color;
    context.fillRect(x, y, size, size);

    // Highlight (top-left)
    const gradient = context.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    context.fillStyle = gradient;
    context.fillRect(x, y, size, size);

    // Border
    context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    context.lineWidth = 2;
    context.strokeRect(x + 1, y + 1, size - 2, size - 2);

    // Inner glow
    context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    context.lineWidth = 1;
    context.strokeRect(x + 2, y + 2, size - 4, size - 4);
}

// ========================================
// COLLISION DETECTION
// ========================================
function collision(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const newX = x + col;
                const newY = y + row;

                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }

                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// ========================================
// MOVEMENT & ROTATION
// ========================================
function move(dir) {
    currentPiece.x += dir;
    if (collision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        currentPiece.x -= dir;
        return false;
    }
    return true;
}

function rotate() {
    const rotated = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
    );

    const prevShape = currentPiece.shape;
    currentPiece.shape = rotated;

    if (collision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        currentPiece.shape = prevShape;
        return false;
    }
    return true;
}

function drop() {
    currentPiece.y++;
    if (collision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        currentPiece.y--;
        merge();
        clearLines();
        spawnPiece();
        return false;
    }
    return true;
}

function hardDrop() {
    let dropDistance = 0;
    while (drop()) {
        dropDistance++;
        score += POINTS.HARD_DROP;
    }
    updateScore();
}

// ========================================
// BOARD MANAGEMENT
// ========================================
function merge() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const boardY = currentPiece.y + y;
                const boardX = currentPiece.x + x;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.color;
                }
            }
        });
    });
}

function clearLines() {
    let linesCleared = 0;

    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            row++; // Check same row again
        }
    }

    if (linesCleared > 0) {
        lines += linesCleared;

        // Calculate score
        switch (linesCleared) {
            case 1: score += POINTS.SINGLE * level; break;
            case 2: score += POINTS.DOUBLE * level; break;
            case 3: score += POINTS.TRIPLE * level; break;
            case 4: score += POINTS.TETRIS * level; break;
        }

        // Update level
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);

        updateScore();
    }
}

// ========================================
// RENDERING
// ========================================
function draw() {
    // Clear canvas
    ctx.fillStyle = 'hsla(240, 25%, 12%, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw board
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(ctx, x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, COLORS[value]);
            }
        });
    });

    // Draw current piece
    if (currentPiece) {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(
                        ctx,
                        (currentPiece.x + x) * BLOCK_SIZE,
                        (currentPiece.y + y) * BLOCK_SIZE,
                        BLOCK_SIZE,
                        COLORS[value]
                    );
                }
            });
        });
    }

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(canvas.width, y * BLOCK_SIZE);
        ctx.stroke();
    }
}

// ========================================
// GAME LOOP
// ========================================
function update(time = 0) {
    if (gameOver || isPaused) {
        if (!gameOver) {
            requestAnimationFrame(update);
        }
        return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        drop();
        dropCounter = 0;
    }

    draw();
    requestAnimationFrame(update);
}

// ========================================
// INPUT HANDLING
// ========================================
function handleKeyPress(e) {
    if (gameOver) return;

    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            move(-1);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            move(1);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (drop()) {
                score += POINTS.SOFT_DROP;
                updateScore();
            }
            dropCounter = 0;
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
            rotate();
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
            break;
        case 'p':
        case 'P':
            togglePause();
            break;
    }

    draw();
}

// ========================================
// UI UPDATES
// ========================================
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

function togglePause() {
    isPaused = !isPaused;
    const btn = document.getElementById('pause-btn');
    btn.textContent = isPaused ? 'Reanudar' : 'Pausar';

    if (!isPaused) {
        lastTime = performance.now();
        update();
    }
}

// ========================================
// GAME STATE MANAGEMENT
// ========================================
function endGame() {
    gameOver = true;
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.remove('hidden');
}

function restart() {
    // Reset state
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0;
    level = 1;
    lines = 0;
    gameOver = false;
    isPaused = false;
    dropCounter = 0;
    dropInterval = 1000;
    lastTime = 0;

    // Reset UI
    updateScore();
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('pause-btn').textContent = 'Pausar';

    // Restart game
    nextPiece = createPiece();
    spawnPiece();
    update();
}

// ========================================
// START GAME
// ========================================
window.addEventListener('load', init);

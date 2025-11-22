// ========================================
// CARD SYMBOLS
// ========================================
const SYMBOLS = {
    easy: ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎬', '🎸'],
    medium: ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎬', '🎸', '🎹', '🎺', '🎻', '🎤'],
    hard: ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎬', '🎸', '🎹', '🎺', '🎻', '🎤', '🎧', '🎼', '🎵', '🎶', '🏀', '⚽']
};

// ========================================
// GAME STATE
// ========================================
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let totalPairs = 8;
let gameStarted = false;
let timerInterval = null;
let startTime = 0;
let elapsedTime = 0;
let difficulty = 'easy';
let canFlip = true;

// ========================================
// INITIALIZATION
// ========================================
function init() {
    // Event listeners
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', resetGame);
    document.getElementById('new-game-btn').addEventListener('click', resetGame);
    document.getElementById('difficulty').addEventListener('change', handleDifficultyChange);

    // Load best time
    loadBestTime();

    // Setup initial game
    setupGame();
}

// ========================================
// GAME SETUP
// ========================================
function setupGame() {
    difficulty = document.getElementById('difficulty').value;

    // Determine grid size based on difficulty
    const symbols = SYMBOLS[difficulty];
    totalPairs = symbols.length;

    // Create card pairs
    cards = [...symbols, ...symbols];

    // Shuffle cards
    cards = shuffleArray(cards);

    // Create card elements
    const board = document.getElementById('game-board');
    board.innerHTML = '';

    // Set grid class
    board.className = 'game-board';
    if (difficulty === 'easy') {
        board.classList.add('grid-4x4');
    } else if (difficulty === 'medium') {
        board.classList.add('grid-4x6');
    } else {
        board.classList.add('grid-6x6');
    }

    // Create cards
    cards.forEach((symbol, index) => {
        const card = createCard(symbol, index);
        board.appendChild(card);
    });

    // Reset game state
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    gameStarted = false;
    canFlip = true;

    updateUI();
}

function createCard(symbol, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = index;
    card.dataset.symbol = symbol;

    card.innerHTML = `
        <div class="card-front"></div>
        <div class="card-back">${symbol}</div>
    `;

    card.addEventListener('click', () => handleCardClick(card));

    return card;
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// ========================================
// GAME LOGIC
// ========================================
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    gameStarted = true;
    startTimer();
}

function handleCardClick(card) {
    if (!gameStarted || !canFlip) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    if (flippedCards.length >= 2) return;

    // Flip card
    card.classList.add('flipped');
    flippedCards.push(card);

    // Check for match if two cards are flipped
    if (flippedCards.length === 2) {
        canFlip = false;
        moves++;
        updateUI();

        setTimeout(checkMatch, 800);
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    const symbol1 = card1.dataset.symbol;
    const symbol2 = card2.dataset.symbol;

    if (symbol1 === symbol2) {
        // Match found
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;

        updateUI();

        // Check if game is won
        if (matchedPairs === totalPairs) {
            setTimeout(winGame, 500);
        }
    } else {
        // No match
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
    }

    flippedCards = [];
    canFlip = true;
}

function winGame() {
    stopTimer();
    gameStarted = false;

    // Update final stats
    document.getElementById('final-moves').textContent = moves;
    document.getElementById('final-time').textContent = formatTime(elapsedTime);

    // Save best time
    saveBestTime();

    // Show win screen
    document.getElementById('win-screen').classList.remove('hidden');
}

// ========================================
// TIMER
// ========================================
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 100);
}

function updateTimer() {
    elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('time').textContent = formatTime(elapsedTime);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ========================================
// UI UPDATES
// ========================================
function updateUI() {
    document.getElementById('moves').textContent = moves;
    document.getElementById('pairs').textContent = `${matchedPairs} / ${totalPairs}`;
}

function handleDifficultyChange() {
    // Only reset if game hasn't started or is over
    if (!gameStarted) {
        resetGame();
    }
}

// ========================================
// BEST TIME MANAGEMENT
// ========================================
function loadBestTime() {
    const bestTime = localStorage.getItem(`memoryBestTime_${difficulty}`);
    if (bestTime) {
        document.getElementById('best-time').textContent = formatTime(parseInt(bestTime));
    } else {
        document.getElementById('best-time').textContent = '--:--';
    }
}

function saveBestTime() {
    const currentBest = localStorage.getItem(`memoryBestTime_${difficulty}`);

    if (!currentBest || elapsedTime < parseInt(currentBest)) {
        localStorage.setItem(`memoryBestTime_${difficulty}`, elapsedTime);
        document.getElementById('best-time').textContent = formatTime(elapsedTime);
    }
}

// ========================================
// GAME RESET
// ========================================
function resetGame() {
    stopTimer();
    elapsedTime = 0;
    document.getElementById('time').textContent = '0:00';
    document.getElementById('win-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');

    loadBestTime();
    setupGame();
}

// ========================================
// START GAME
// ========================================
window.addEventListener('load', init);

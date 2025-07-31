// tictactoe.js

// --- DOM Element References ---
let body;
let gameboard;
let turnMessageDisplay;
let infoDisplay;
let newGameBtn;
let playerOCircleScoreDisplay;
let playerXCrossScoreDisplay;
let tiesScoreDisplay;
let clearScoresBtn;
let llmCommentaryDisplay;
let llmLoadingIndicator;
let xWinBurst;
let oWinEffect;

let singlePlayerBtn;
let twoPlayerBtn;


// --- Game State Variables (Client-side) ---
let currentBoard = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = 'circle';
let gameEnded = false;
let playerOScore = 0;
let playerXScore = 0;
let tiesScore = 0;
let gameMode = null;

// Winning combinations
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]    // Diagonals
];

// --- Utility Functions ---
function capitalizePlayerName(player) {
    return player.charAt(0).toUpperCase() + player.slice(1);
}

function updateGameStatus(message) {
    if (infoDisplay) {
        infoDisplay.textContent = message;
        infoDisplay.style.display = 'block';
    }
}

function updateTurnMessage(player) {
    if (turnMessageDisplay) {
        if (gameEnded) {
            turnMessageDisplay.textContent = "Game Over!";
        } else {
            turnMessageDisplay.textContent = `It's ${capitalizePlayerName(player)}'s turn!`;
        }
        turnMessageDisplay.style.display = 'block';
    }
}

// --- Game Board Rendering ---
function createBoardCells() {
    if (!gameboard) {
        console.error("Game board element not found!");
        return;
    }
    gameboard.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.id = i;
        cell.addEventListener('click', () => handleCellClick(cell));
        gameboard.appendChild(cell, false);
    }
    console.log("Board cells created.");
}

function renderBoard(boardState) {
    currentBoard = boardState;
    const cells = gameboard.children;
    for (let i = 0; i < boardState.length; i++) {
        const cell = cells[i];
        if (cell) {
            cell.textContent = boardState[i] === 'circle' ? 'O' : (boardState[i] === 'x' ? 'X' : '');
            cell.classList.remove('O', 'X');
            if (boardState[i] === 'circle') {
                cell.classList.add('O');
            } else if (boardState[i] === 'x') {
                cell.classList.add('X');
            }
        }
    }
    console.log("Board rendered.");
}

// --- Game Logic ---
function checkForWin(board, player) {
    return winningConditions.some(combination => {
        const [a, b, c] = combination;
        return board[a] === player && board[b] === player && board[c] === player;
    });
}

function checkForDraw(board) {
    return !board.includes("");
}

function hideGameElements() {
    if (gameboard) gameboard.style.display = 'none';
    if (newGameBtn) newGameBtn.style.display = 'none';
    if (clearScoresBtn) clearScoresBtn.style.display = 'none';
    const scoresDiv = document.querySelector('.scores');
    if (scoresDiv) scoresDiv.style.display = 'none';
    if (turnMessageDisplay) turnMessageDisplay.style.display = 'none';
    if (infoDisplay) infoDisplay.style.display = 'none';
    if (llmCommentaryDisplay) llmCommentaryDisplay.style.display = 'none';
    if (llmLoadingIndicator) llmLoadingIndicator.style.display = 'none';
    if (singlePlayerBtn) singlePlayerBtn.style.display = 'block';
    if (twoPlayerBtn) twoPlayerBtn.style.display = 'block';
    console.log("Game elements hidden. Mode selection visible."); // DEBUG LOG
}

function showGameElements() {
    if (gameboard) gameboard.style.display = 'grid';
    if (newGameBtn) newGameBtn.style.display = 'block';
    if (clearScoresBtn) clearScoresBtn.style.display = 'block';
    const scoresDiv = document.querySelector('.scores');
    if (scoresDiv) scoresDiv.style.display = 'flex';
    if (turnMessageDisplay) turnMessageDisplay.style.display = 'block';
    if (infoDisplay) infoDisplay.style.display = 'block';
    if (llmCommentaryDisplay) llmCommentaryDisplay.textContent = '';
    if (llmCommentaryDisplay) llmCommentaryDisplay.style.display = 'block';
    if (llmLoadingIndicator) llmLoadingIndicator.style.display = 'none';
    if (singlePlayerBtn) singlePlayerBtn.style.display = 'none';
    if (twoPlayerBtn) twoPlayerBtn.style.display = 'none';
    console.log("Game elements shown. Mode selection hidden."); // DEBUG LOG
}


function startGame(mode) {
    gameMode = mode;
    console.log("startGame called. gameMode set to:", gameMode); // DEBUG LOG
    showGameElements();
    resetGame();

    if (gameMode === 'singlePlayer') {
        updateGameStatus("You are playing against the AI!");
        // Optional: Uncomment below if you want AI to have a chance to go first
        // if (Math.random() < 0.5) {
        //     currentPlayer = 'x';
        //     updateTurnMessage(currentPlayer);
        //     setTimeout(() => makeAIMove(), 500);
        //     console.log("AI starting first."); // DEBUG LOG
        // }
    } else {
        updateGameStatus("Two players: Human vs. Human!");
    }
}


function makeAIMove() {
    console.log("makeAIMove called. Finding empty cells..."); // DEBUG LOG
    const emptyCells = [];
    for (let i = 0; i < currentBoard.length; i++) {
        if (currentBoard[i] === "") {
            emptyCells.push(i);
        }
    }
    console.log("Empty cells found by AI:", emptyCells); // DEBUG LOG

    if (emptyCells.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const aiMoveIndex = emptyCells[randomIndex];
        console.log("AI selected cell index:", aiMoveIndex); // DEBUG LOG

        const aiCell = document.getElementById(aiMoveIndex.toString());
        if (aiCell) {
            console.log("AI simulating click on cell with ID:", aiCell.id); // DEBUG LOG
            handleCellClick(aiCell); // AI "clicks" its chosen cell
        } else {
            console.error("makeAIMove: Could not find DOM element for selected AI cell ID:", aiMoveIndex); // CRITICAL ERROR LOG
        }
    } else {
        console.warn("makeAIMove: No empty cells found! This means game should have ended."); // DEBUG LOG
    }
}

/**
 * Handles a click on a cell.
 * @param {HTMLElement} cell The cell element that was clicked.
 * @param {boolean} [isAI=false] Whether the call is from the AI or a human.
 */
function handleCellClick(cell, isAI = true) { // Add isAI parameter, default to false
    const cellId = parseInt(cell.id);
    console.log(`handleCellClick called for cell ID: ${cellId}. Current Player: ${currentPlayer}. Game Ended: ${gameEnded}. Game Mode: ${gameMode}.`); // DEBUG LOG

    // Prevent moves if game ended or cell occupied
    if (gameEnded || currentBoard[cellId] !== "") {
        console.log(`Move blocked: Game ended (${gameEnded}) or cell ${cellId} already occupied (${currentBoard[cellId]}).`); // DEBUG LOG
        return;
    }

    // Block human input if it's AI's turn in single player mode, unless the call is from AI itself
    if (gameMode === 'singlePlayer' && currentPlayer === 'x' && !isAI) {
        console.log("handleCellClick: It's AI's turn, blocking human click on cell:", cellId); // DEBUG LOG
        return; // Prevents human from clicking during AI's processing time
    }

    // Apply the move
    currentBoard[cellId] = currentPlayer;
    renderBoard(currentBoard); // Update the visual board
    console.log("Board state after move:", currentBoard); // DEBUG LOG

    // Check for win/draw
    if (checkForWin(currentBoard, currentPlayer)) {
        gameEnded = true;
        updateScores(currentPlayer);
        updateGameStatus(`${capitalizePlayerName(currentPlayer)} won!`);
        updateTurnMessage(currentPlayer);
        console.log(`Game over: ${capitalizePlayerName(currentPlayer)} won!`); // DEBUG LOG

        if (currentPlayer === 'x') {
            if (body) {
                body.classList.add('body-x-wins');
                setTimeout(() => body.classList.remove('body-x-wins'), 3000);
            }
            triggerFireworks();
        } else if (currentPlayer === 'circle') {
            if (body) {
                body.classList.add('body-o-wins');
                setTimeout(() => body.classList.remove('body-o-wins'), 3000);
            }
            triggerFireworks();
        }
        fetchLLMCommentary(`${capitalizePlayerName(currentPlayer)} won!`);
        return;

    } else if (checkForDraw(currentBoard)) {
        gameEnded = true;
        updateScores('draw');
        updateGameStatus("It's a draw!");
        updateTurnMessage(currentPlayer);
        console.log("Game over: It's a draw!"); // DEBUG LOG
        fetchLLMCommentary("It's a draw!");
        return;

    } else {
        // Switch turn
        currentPlayer = currentPlayer === 'circle' ? 'x' : 'circle';
        updateTurnMessage(currentPlayer);
        console.log("Player switched. New current player:", currentPlayer); // DEBUG LOG

        // If in single-player mode and it's AI's turn, trigger AI move
        if (gameMode === 'singlePlayer' && !gameEnded && currentPlayer === 'x') {
            console.log("AI turn condition met. Disabling pointer events for 700ms."); // DEBUG LOG
            if (gameboard) gameboard.style.pointerEvents = 'none'; // Disable clicks while AI "thinks"
            setTimeout(() => {
                console.log("AI thinking time elapsed. Calling makeAIMove."); // DEBUG LOG
                makeAIMove(); // Execute AI's move
                // Re-enable clicks after AI has attempted a move, even if it ends the game
                if (gameboard) {
                    gameboard.style.pointerEvents = 'auto';
                    console.log("Pointer events re-enabled after AI move."); // DEBUG LOG
                }
            }, 700);
        } else if (gameMode === 'singlePlayer' && currentPlayer === 'circle') {
            console.log("It's human's turn (Circle) in single player mode. Awaiting click."); // DEBUG LOG
        }
    }
}

function updateScores(winner) {
    if (winner === 'circle') {
        playerOScore++;
    } else if (winner === 'x') {
        playerXScore++;
    } else if (winner === 'draw') {
        tiesScore++;
    }
    playerOCircleScoreDisplay.textContent = playerOScore;
    playerXCrossScoreDisplay.textContent = playerXScore;
    tiesScoreDisplay.textContent = tiesScore;
    saveScores();
    console.log(`Scores updated. O: ${playerOScore}, X: ${playerXScore}, Ties: ${tiesScore}`); // DEBUG LOG
}

function loadScores() {
    const storedScores = localStorage.getItem('ticTacToeScores');
    if (storedScores) {
        try {
            const scores = JSON.parse(storedScores);
            playerOScore = scores.playerOScore || 0;
            playerXScore = scores.playerXScore || 0;
            tiesScore = scores.tiesScore || 0;
            playerOCircleScoreDisplay.textContent = playerOScore;
            playerXCrossScoreDisplay.textContent = playerXScore;
            tiesScoreDisplay.textContent = tiesScore;
            console.log("Scores loaded from localStorage."); // DEBUG LOG
        } catch (e) {
            console.error("Error parsing scores from localStorage:", e); // ERROR LOG
        }
    } else {
        console.log("No scores found in localStorage."); // DEBUG LOG
    }
}

function saveScores() {
    const scores = {
        playerOScore,
        playerXScore,
        tiesScore
    };
    localStorage.setItem('ticTacToeScores', JSON.stringify(scores));
    console.log("Scores saved to localStorage."); // DEBUG LOG
}

function clearScores() {
    playerOScore = 0;
    playerXScore = 0;
    tiesScore = 0;
    playerOCircleScoreDisplay.textContent = playerOScore;
    playerXCrossScoreDisplay.textContent = playerXScore;
    tiesScoreDisplay.textContent = tiesScore;
    localStorage.removeItem('ticTacToeScores');
    console.log("Scores cleared from display and localStorage."); // DEBUG LOG
}

function resetGame() {
    currentBoard = ["", "", "", "", "", "", "", "", ""];
    currentPlayer = 'circle';
    gameEnded = false;
    renderBoard(currentBoard);
    updateGameStatus("Good luck, have fun!");
    updateTurnMessage(currentPlayer);
    if (llmCommentaryDisplay) llmCommentaryDisplay.textContent = '';
    console.log("Game reset. Board cleared. Current Player set to 'circle'."); // DEBUG LOG

    if (body) {
        body.classList.remove('body-o-wins', 'body-x-wins');
    }
    if (gameboard) {
        gameboard.style.pointerEvents = 'auto'; // Ensure board is clickable after reset
    }
}

function triggerFireworks() {
    console.log("Triggering fireworks..."); // DEBUG LOG
    const fireworksContainer = document.createElement('div');
    fireworksContainer.classList.add('fireworks-container');
    document.body.appendChild(fireworksContainer);

    const colors = currentPlayer === 'x' ? ['#ff0000', '#ff6600', '#ffcc00'] : ['#00ff00', '#00cc66', '#33ff33'];
    const numberOfExplosions = 10;

    for (let i = 0; i < numberOfExplosions; i++) {
        createFirework(fireworksContainer, colors);
    }

    setTimeout(() => {
        if (document.body.contains(fireworksContainer)) {
            document.body.removeChild(fireworksContainer);
            console.log("Fireworks container removed."); // DEBUG LOG
        }
    }, 2000);
}

function createFirework(container, colors) {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const numberOfSparks = 30;
    const color = colors[Math.floor(Math.random() * colors.length)];

    for (let i = 0; i < numberOfSparks; i++) {
        const spark = document.createElement('div');
        spark.classList.add('firework-spark');
        spark.style.backgroundColor = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        container.appendChild(spark);
        animateSpark(spark, vx, vy);
    }
}

function animateSpark(spark, vx, vy) {
    let life = 100;
    const gravity = 0.05;
    const fadeSpeed = 1;

    function update() {
        if (life <= 0) {
            if (spark.parentNode) {
                spark.remove();
            }
            return;
        }

        const x = parseFloat(spark.style.left);
        const y = parseFloat(spark.style.top);
        let opacity = life / 100;

        spark.style.left = `${x + vx}px`;
        spark.style.top = `${y + vy}px`;
        spark.style.opacity = opacity;
        vy += gravity;
        life -= fadeSpeed;

        requestAnimationFrame(update);
    }
    update();
}

async function fetchLLMCommentary(outcomeDescription) {
    console.log("Fetching LLM commentary for:", outcomeDescription); // DEBUG LOG
    if (llmLoadingIndicator) llmLoadingIndicator.classList.remove('hidden');
    if (llmCommentaryDisplay) llmCommentaryDisplay.textContent = '';

    const prompt = `The tic-tac-toe game just ended. Outcome: ${outcomeDescription}. Give a very short, cheerful, and slightly witty comment about this outcome.`;

    const apiKey = "AIzaSyDhvw95rpSvkQLhxc0EZOYxjDHbiI4aFRE";
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
        console.warn("LLM API Key is missing or default. Commentary will not work.");
        if (llmLoadingIndicator) llmLoadingIndicator.classList.add('hidden');
        if (llmCommentaryDisplay) llmCommentaryDisplay.textContent = 'API key missing for commentary.';
        return;
    }

    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const payload = { contents: chatHistory };

    try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('LLM API Error:', errorData); // ERROR LOG
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.error.message}`);
        }

        const data = await response.json();
        const commentary = data.candidates[0].content.parts[0].text;
        if (llmCommentaryDisplay) llmCommentaryDisplay.textContent = commentary;
        console.log("LLM commentary received:", commentary); // DEBUG LOG

    } catch (error) {
        console.error('Failed to fetch LLM commentary:', error); // ERROR LOG
        if (llmCommentaryDisplay) llmCommentaryDisplay.textContent = 'Failed to load commentary.';
    } finally {
        if (llmLoadingIndicator) llmLoadingIndicator.classList.add('hidden');
    }
}


// --- DOM Ready Event ---
document.addEventListener("DOMContentLoaded", () => {
    body = document.body;
    gameboard = document.getElementById("gameboard");
    turnMessageDisplay = document.getElementById("turnMessage");
    infoDisplay = document.getElementById("info");
    newGameBtn = document.getElementById("newGameBtn");
    playerOCircleScoreDisplay = document.getElementById("playerOCircleScore");
    playerXCrossScoreDisplay = document.getElementById("playerXCrossScore");
    tiesScoreDisplay = document.getElementById("tiesScore");
    clearScoresBtn = document.getElementById("clearScoresBtn");
    llmCommentaryDisplay = document.getElementById("llmCommentaryDisplay");
    llmLoadingIndicator = document.getElementById("llmLoadingIndicator");
    xWinBurst = document.getElementById("xWinBurst");
    oWinEffect = document.getElementById("oWinEffect");

    singlePlayerBtn = document.getElementById("singlePlayerBtn");
    twoPlayerBtn = document.getElementById("twoPlayerBtn");

    if (newGameBtn) {
        newGameBtn.addEventListener('click', resetGame);
    }
    if (clearScoresBtn) {
        clearScoresBtn.addEventListener('click', clearScores);
    }
    if (singlePlayerBtn) {
        singlePlayerBtn.addEventListener('click', () => startGame('singlePlayer'));
    }
    if (twoPlayerBtn) {
        twoPlayerBtn.addEventListener('click', () => startGame('twoPlayer'));
    }

    console.log("DOM Content Loaded. All elements assigned. Initializing game setup."); // DEBUG LOG
    createBoardCells();
    loadScores();
    hideGameElements(); // Start with mode selection visible
});
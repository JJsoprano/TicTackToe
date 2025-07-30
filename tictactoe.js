// tictactoe.js

// --- DOM Element References ---
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

// --- Game State Variables (Client-side) ---
let currentBoard = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = 'circle'; // Game starts with 'circle' (O)
let gameEnded = false;
let playerOScore = 0;
let playerXScore = 0;
let tiesScore = 0;

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
    }
}

function updateTurnMessage(player) {
    if (turnMessageDisplay) {
        if (gameEnded) {
            turnMessageDisplay.textContent = "Game Over!";
        } else {
            turnMessageDisplay.textContent = `It's ${capitalizePlayerName(player)}'s turn!`;
        }
    }
}

// --- Game Board Rendering ---
function createBoardCells() {
    if (!gameboard) {
        console.error("Game board element not found!");
        return;
    }
    gameboard.innerHTML = ''; // Clear existing cells
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.id = i; // Assign ID based on index
        cell.addEventListener('click', () => handleCellClick(cell)); // Add click listener
        gameboard.appendChild(cell);
    }
    console.log("Board cells created.");
}

function renderBoard(boardState) {
    currentBoard = boardState; // Update client-side board state
    const cells = gameboard.children;
    for (let i = 0; i < boardState.length; i++) {
        const cell = cells[i];
        if (cell) {
            cell.textContent = boardState[i] === 'circle' ? 'O' : (boardState[i] === 'x' ? 'X' : '');
            cell.classList.remove('O', 'X'); // Clear previous
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

function handleCellClick(cell) {
    const cellId = parseInt(cell.id);

    // Validation
    if (gameEnded || currentBoard[cellId] !== "") {
        console.log("Cannot make move: Game ended or cell occupied.");
        return;
    }

    // Apply the move
    currentBoard[cellId] = currentPlayer;
    renderBoard(currentBoard); // Update the visual board

    // Check for win/draw
    if (checkForWin(currentBoard, currentPlayer)) {
        gameEnded = true;
        updateScores(currentPlayer);
        updateGameStatus(`${capitalizePlayerName(currentPlayer)} won!`);
        updateTurnMessage(currentPlayer); // Game Over!
        if (currentPlayer === 'x') {
            xWinBurst.style.display = 'block';
            setTimeout(() => xWinBurst.style.display = 'none', 1500);
        } else if (currentPlayer === 'circle') {
            oWinEffect.style.display = 'block';
            setTimeout(() => oWinEffect.style.display = 'none', 1500);
        }
        fetchLLMCommentary(`${capitalizePlayerName(currentPlayer)} won!`);

    } else if (checkForDraw(currentBoard)) {
        gameEnded = true;
        updateScores('draw');
        updateGameStatus("It's a draw!");
        updateTurnMessage(currentPlayer); // Game Over!
        fetchLLMCommentary("It's a draw!");

    } else {
        // Switch turn
        currentPlayer = currentPlayer === 'circle' ? 'x' : 'circle';
        updateGameStatus("Make your move!");
        updateTurnMessage(currentPlayer);
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
    saveScores(); // Save scores to local storage
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
        } catch (e) {
            console.error("Error parsing scores from localStorage:", e);
        }
    }
}

function saveScores() {
    const scores = {
        playerOScore,
        playerXScore,
        tiesScore
    };
    localStorage.setItem('ticTacToeScores', JSON.stringify(scores));
}

function clearScores() {
    playerOScore = 0;
    playerXScore = 0;
    tiesScore = 0;
    playerOCircleScoreDisplay.textContent = playerOScore;
    playerXCrossScoreDisplay.textContent = playerXScore;
    tiesScoreDisplay.textContent = tiesScore;
    localStorage.removeItem('ticTacToeScores'); // Clear from local storage
    console.log("Scores cleared.");
}

// Function to reset the game
function resetGame() {
    currentBoard = ["", "", "", "", "", "", "", "", ""];
    currentPlayer = 'circle';
    gameEnded = false;
    renderBoard(currentBoard); // Render empty board
    updateGameStatus("Good luck, have fun!");
    updateTurnMessage(currentPlayer);
    if (llmCommentaryDisplay) llmCommentaryDisplay.textContent = ''; // Clear old commentary
    console.log("Game reset.");
}

// --- LLM Commentary ---
async function fetchLLMCommentary(outcomeDescription) {
    if (llmLoadingIndicator) llmLoadingIndicator.classList.remove('hidden');
    if (llmCommentaryDisplay) llmCommentaryDisplay.textContent = '';

    const prompt = `The tic-tac-toe game just ended. Outcome: ${outcomeDescription}. Give a very short, cheerful, and slightly witty comment about this outcome.`;

    // IMPORTANT: REPLACE "YOUR_GEMINI_API_KEY_HERE" WITH YOUR ACTUAL API KEY
    const apiKey = "AIzaSyDhvw95rpSvkQLhxc0EZOYxjDHbiI4aFRE";
    if (apiKey === "YOUR_GEMINI_API_KEY_HERE" || !apiKey) {
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
            console.error('LLM API Error:', errorData);
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.error.message}`);
        }

        const data = await response.json();
        const commentary = data.candidates[0].content.parts[0].text;
        if (llmCommentaryDisplay) llmCommentaryDisplay.textContent = commentary;

    } catch (error) {
        console.error('Failed to fetch LLM commentary:', error);
        if (llmCommentaryDisplay) llmCommentaryDisplay.textContent = 'Failed to load commentary.';
    } finally {
        if (llmLoadingIndicator) llmLoadingIndicator.classList.add('hidden');
    }
}


// --- DOM Ready Event ---
document.addEventListener("DOMContentLoaded", () => {
    // Assign DOM elements
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

    // Event Listeners
    if (newGameBtn) {
        newGameBtn.addEventListener('click', resetGame);
    }
    if (clearScoresBtn) {
        clearScoresBtn.addEventListener('click', clearScores);
    }

    // Initial board setup
    createBoardCells();
    loadScores();
    resetGame();
});
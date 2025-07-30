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
let body; // Add this line
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

/**
 * Updates the text content of the element with the ID "info" with the given message.
 * If no such element exists, does nothing.
 * @param {string} message The text to display in the game status area.
 */
function updateGameStatus(message) {
    if (infoDisplay) {
        infoDisplay.textContent = message;
    }
}

/**
 * Updates the "Whose turn is it?" message on the game board.
 * If the game is over, shows "Game Over!" instead.
 * @param {string} player The current player's name ('circle' or 'x').
 */
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

/**
 * Renders the current state of the Tic Tac Toe game board in the DOM.
 *
 * @param {Array<string>} boardState The current state of the game board, where each element represents a cell.
 *     The elements can have one of the following values: 'circle' (O), 'x' (X), or an empty string (empty cell).
 */
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

/**
 * Checks if the game board is in a draw state.
 *
 * @param {Array<string>} board The current state of the game board, where each element represents a cell.
 * @returns {boolean} True if there are no empty cells, indicating a draw; otherwise, false.
 */

/**
 * Checks if the game board is in a draw state.
 *
 * @param {Array<string>} board The current state of the game board, where each element represents a cell.
 * @returns {boolean} True if there are no empty cells, indicating a draw; otherwise, false.
 */
function checkForDraw(board) {
    return !board.includes("");
}
/**
 * Creates a fireworks explosion on the page for a short duration.
 * Does not clear up after itself, caller is responsible for removing the container.
 * @param {HTMLElement} container - The element to append the sparks to
 * @param {Array<string>} colors - An array of colors to randomly select from
 */
function triggerFireworks() {
    const fireworksContainer = document.createElement('div');
    fireworksContainer.classList.add('fireworks-container');
    document.body.appendChild(fireworksContainer);

    const colors = ['#ff0', '#f00', '#0f0', '#00f', '#f0f'];
    const numberOfExplosions = 10;

    for (let i = 0; i < numberOfExplosions; i++) {
        createFirework(fireworksContainer, colors);
    }

    setTimeout(() => {
        document.body.removeChild(fireworksContainer);
    }, 2000);
}

/**
 * Creates a firework explosion on the page
 * @param {HTMLElement} container - The element to append the sparks to
 * @param {Array<string>} colors - An array of colors to randomly select from
 */
function createFirework(container, colors) {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const numberOfSparks = 30;
    const color = colors[[Math.floor(Math.random() * colors.length)]];

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

/**
 * Animates a single firework spark.
 *
 * @param {HTMLElement} spark The HTML element to animate.
 * @param {number} vx The horizontal velocity of the spark.
 * @param {number} vy The vertical velocity of the spark.
 *
 * @description
 *     This function animates a single firework spark by updating its
 *     position, opacity, and velocity over time. The spark's position is
 *     updated based on its horizontal and vertical velocities, and its
 *     opacity is decreased over time to simulate a fading effect. The
 *     function uses requestAnimationFrame to schedule the next update,
 *     which allows the animation to be paused if the user switches to
 *     another tab.
 */
function animateSpark(spark, vx, vy) {
    let life = 100;
    const gravity = 0.05;
    const fadeSpeed = 1;

    function update() {
        if (life <= 0) {
            spark.remove();
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
/**
 * Handles a player's click on a cell in the game board.
 *
 * @param {HTMLElement} cell The cell element that was clicked.
 */
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
            // X wins: Turn screen red AND trigger fireworks
            if (body) {
                body.classList.add('body-x-wins');
                setTimeout(() => {
                    body.classList.remove('body-x-wins');
                }, 3000); // Remove red class after 3 seconds
            }
            triggerFireworks(); // Trigger fireworks for X
            // Removed existing xWinBurst, as fireworks are now the main effect
            // xWinBurst.style.display = 'block';
            // setTimeout(() => xWinBurst.style.display = 'none', 1500);

        } else if (currentPlayer === 'circle') {
            // O wins: Turn screen green AND trigger fireworks
            if (body) {
                body.classList.add('body-o-wins');
                setTimeout(() => {
                    body.classList.remove('body-o-wins');
                }, 3000); // Remove green class after 3 seconds
            }
            triggerFireworks(); // Trigger fireworks for O
            // Removed existing oWinEffect, as fireworks are now the main effect
            // oWinEffect.style.display = 'block';
            // setTimeout(() => oWinEffect.style.display = 'none', 1500);
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


/**
 * Updates the scores based on the game outcome and updates the display.
 *
 * Increments the score for the winning player or ties if applicable.
 * Updates the score display elements for player O, player X, and ties.
 * Saves the updated scores to local storage.
 *
 * @param {string} winner - The winner of the game ('circle', 'x', or 'draw').
 */

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

/**
 * Loads the saved game scores from local storage and updates the score display elements.
 *
 * Retrieves the scores for player O, player X, and ties from local storage,
 * parses them, and updates the corresponding score display elements on the page.
 * If there is an error parsing the stored scores, the function logs an error to the console.
 */

/**
 * Loads the saved game scores from local storage and updates the score display elements.
 *
 * Retrieves the scores for player O, player X, and ties from local storage,
 * parses them, and updates the corresponding score display elements on the page.
 * If there is an error parsing the stored scores, the function logs an error to the console.
 */
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

/**
 * Saves the current game scores to local storage.
 *
 * Creates a JSON object containing the scores for player O, player X, and ties,
 * and saves it to local storage under the key 'ticTacToeScores'.
 * If there is an error saving the scores, the function logs an error to the console.
 */
function saveScores() {
    const scores = {
        playerOScore,
        playerXScore,
        tiesScore
    };
    localStorage.setItem('ticTacToeScores', JSON.stringify(scores));
}

/**
 * Resets the game scores to zero and clears the score display elements.
 *
 * Clears the scores for player O, player X, and ties from local storage.
 * Resets the score display elements on the page to zero.
 * Logs a success message to the console.
 */
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
    body = document.body; // Add this line
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
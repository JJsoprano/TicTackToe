// --- DOM Element References ---
// Declare variables here using 'let', they will be assigned inside DOMContentLoaded
let gameBoard;
let infoDisplay;
let playerOCircleScoreSpan;
let playerXCrossScoreSpan;
let tiesScoreSpan;
let newGameBtn;

// --- Game State Variables ---
// This array represents the Tic-Tac-Toe grid's content
const boardState = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "circle"; // Game starts with "circle" (O)
let gameEnded = false; // Flag to indicate if the game has ended (win or draw)

// Scores for each player and ties, initialized to 0.
// These will now be loaded from localStorage.
let playerOCircleWins = 0;
let playerXCrossWins = 0;
let ties = 0;

// --- Functions ---

/**
 * Loads scores from localStorage.
 * If no scores are found, initializes them to 0.
 */
function loadScores() {
    try {
        const savedPlayerOCircleWins = localStorage.getItem('ticTacToePlayerOCircleWins');
        const savedPlayerXCrossWins = localStorage.getItem('ticTacToePlayerXCrossWins');
        const savedTies = localStorage.getItem('ticTacToeTies');

        playerOCircleWins = savedPlayerOCircleWins ? parseInt(savedPlayerOCircleWins) : 0;
        playerXCrossWins = savedPlayerXCrossWins ? parseInt(savedPlayerXCrossWins) : 0;
        ties = savedTies ? parseInt(savedTies) : 0;

        console.log("LOAD_SCORES: Scores loaded:", { playerOCircleWins, playerXCrossWins, ties });
    } catch (e) {
        console.error("LOAD_SCORES: Error loading scores from localStorage:", e);
        // If there's an error, ensure scores are reset to 0 to prevent issues
        playerOCircleWins = 0;
        playerXCrossWins = 0;
        ties = 0;
    }
}


/**
 * Saves current scores to localStorage.
 */
function saveScores() {
    try {
        localStorage.setItem('ticTacToePlayerOCircleWins', playerOCircleWins.toString());
        localStorage.setItem('ticTacToePlayerXCrossWins', playerXCrossWins.toString());
        localStorage.setItem('ticTacToeTies', ties.toString());
        console.log("SAVE_SCORES: Scores saved:", { playerOCircleWins, playerXCrossWins, ties });
    } catch (e) {
        console.error("SAVE_SCORES: Error saving scores to localStorage:", e);
    }
}

/**
 * Updates the score display spans in the HTML with the current win and tie counts.
 */
function updateScoreDisplay() {
    console.log("UPDATE_DISPLAY: Attempting to update scores with values:", { playerOCircleWins, playerXCrossWins, ties });
    if (playerOCircleScoreSpan) {
        playerOCircleScoreSpan.textContent = playerOCircleWins;
        console.log("UPDATE_DISPLAY: Player Circle Score Span updated to:", playerOCircleScoreSpan.textContent);
    } else {
        console.warn("UPDATE_DISPLAY: playerOCircleScoreSpan is null or undefined. Cannot update score.");
    }
    if (playerXCrossScoreSpan) {
        playerXCrossScoreSpan.textContent = playerXCrossWins;
        console.log("UPDATE_DISPLAY: Player Cross Score Span updated to:", playerXCrossScoreSpan.textContent);
    } else {
        console.warn("UPDATE_DISPLAY: playerXCrossScoreSpan is null or undefined. Cannot update score.");
    }
    if (tiesScoreSpan) {
        tiesScoreSpan.textContent = ties;
        console.log("UPDATE_DISPLAY: Ties Score Span updated to:", tiesScoreSpan.textContent);
    } else {
        console.warn("UPDATE_DISPLAY: tiesScoreSpan is null or undefined. Cannot update score.");
    }
}

// Winning combinations (indices of cells)
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

/**
 * Initializes or resets the game board by dynamically creating square elements.
 * Each square is given a 'square' class and a 'data-id' for tracking.
 */
function createBoard() {
    // Hide the "New Game" button at the start of a new game round
    if (newGameBtn) { // This check is still good practice
        newGameBtn.style.display = "none";
        console.log("CREATE_BOARD: New Game button hidden.");
    } else {
        console.warn("CREATE_BOARD: newGameBtn is null, cannot hide.");
    }

    // Clear any existing squares from the gameBoard div (important for restarting)
    if (gameBoard) { // Ensure gameBoard is not null before clearing
        gameBoard.innerHTML = '';
        console.log("CREATE_BOARD: Game board cleared.");
    } else {
        console.error("CREATE_BOARD: gameBoard element not found!");
        return; // Prevent further errors if gameBoard is missing
    }

    // Loop 9 times to create each of the Tic-Tac-Toe squares
    boardState.forEach((_cellValue, index) => { // _cellValue is ignored, 'index' is used
        const cellElement = document.createElement('div');
        cellElement.classList.add("square"); // Add the CSS class "square"
        cellElement.dataset.id = index; // Store the unique index as a data attribute (e.g., data-id="0")
        cellElement.addEventListener("click", handleCellClick); // Attach a click event listener
        gameBoard.append(cellElement); // Add the newly created square to the gameBoard div
    });
    console.log("CREATE_BOARD: 9 squares created and added to the board.");
}

/**
 * Handles a click event on a game square.
 * Updates game state, places player mark, and checks for win/draw.
 * @param {Event} event The click event object.
 */
function handleCellClick(event) {
    const clickedCell = event.target; // The actual 'square' div that was clicked
    const clickedCellId = parseInt(clickedCell.dataset.id); // Get its unique ID from the data-id attribute
    console.log(`HANDLE_CLICK: Cell ${clickedCellId} clicked by ${currentPlayer}.`);

    // 1. Validate the move:
    // Check if the cell is already taken (not empty)
    // OR if the game has already ended (a winner or draw)
    if (boardState[clickedCellId] !== "" || gameEnded) {
        console.log("HANDLE_CLICK: Invalid move - cell occupied or game ended.");
        return; // If invalid move, do nothing
    }

    // 2. Update game state:
    boardState[clickedCellId] = currentPlayer; // Mark the cell in our boardState array
    console.log("HANDLE_CLICK: boardState updated:", boardState);

    // 3. Place the visual mark (X or O) on the board:
    const playerMark = document.createElement("div"); // Create a new div for the mark
    playerMark.classList.add(currentPlayer); // Add 'circle' or 'x' class for styling
    clickedCell.append(playerMark); // Append this mark div inside the clicked square
    console.log(`HANDLE_CLICK: Placed ${currentPlayer} mark on cell ${clickedCellId}.`);

    // 4. Check for win or draw:
    if (checkForWin()) {
        console.log("HANDLE_CLICK: Win detected!");
        if (infoDisplay) { // Ensure infoDisplay is not null
            infoDisplay.innerHTML = `${currentPlayer.toUpperCase()} is the winner!`; // Display winner message
        }
        gameEnded = true; // Set game state to ended

        // Increment winner's score
        if (currentPlayer === "circle") {
            playerOCircleWins++;
        } else {
            playerXCrossWins++;
        }
        console.log("HANDLE_CLICK: Scores incremented.", { playerOCircleWins, playerXCrossWins });
        updateScoreDisplay(); // Update score display
        saveScores(); // Save scores to localStorage after a win
        if (newGameBtn) { // Added a check
            newGameBtn.style.display = "inline"; // Show the "New Game" button
            console.log("HANDLE_CLICK: New Game button shown after win.");
        }
    } else if (checkForDraw()) {
        console.log("HANDLE_CLICK: Draw detected!");
        if (infoDisplay) { // Ensure infoDisplay is not null
            infoDisplay.innerHTML = "It's a draw!"; // Display draw message
        }
        gameEnded = true; // Set game state to ended

        // Increment ties score
        ties++;
        console.log("HANDLE_CLICK: Ties incremented.", { ties });
        updateScoreDisplay(); // Update score display
        saveScores(); // Save scores to localStorage after a tie
        if (newGameBtn) { // Added a check
            newGameBtn.style.display = "inline"; // Show the "New Game" button
            console.log("HANDLE_CLICK: New Game button shown after draw.");
        }
    } else {
        // 5. If no win or draw, switch to the next player's turn:
        currentPlayer = currentPlayer === "circle" ? "x" : "circle";
        if (infoDisplay) { // Ensure infoDisplay is not null
            infoDisplay.textContent = `It is now ${currentPlayer}'s turn`; // Update info display
        }
        console.log("HANDLE_CLICK: Switched turn to:", currentPlayer);
    }
}

/**
 * Checks if the current player has achieved a winning combination.
 * @returns {boolean} True if the current player has won, false otherwise.
 */
function checkForWin() {
    // Iterate through all possible winning combinations
    return winningConditions.some(combination => {
        const [a, b, c] = combination; // Destructure the three cell indices for the current combination

        // Check if all three cells in this combination are occupied by the currentPlayer's mark
        return boardState[a] === currentPlayer &&
               boardState[b] === currentPlayer &&
               boardState[c] === currentPlayer;
    });
}

/**
 * Checks if the game is a draw.
 * A draw occurs if no player has won and all cells are filled.
 * @returns {boolean} True if the game is a draw, false otherwise.
 */
function checkForDraw() {
    // If the boardState array does not contain any empty strings, it means all cells are filled.
    // Combined with no win, this implies a draw.
    return !boardState.includes("");
}

/**
 * Resets the game to its initial state for a new round (scores are preserved).
 * Clears the board, resets player turn, hides "New Game" button, and updates info display.
 */
function restartGame() {
    console.log("RESTART_GAME: Starting game restart process.");
    boardState.fill(""); // Clear all marks from the boardState array (set all to empty strings)
    gameEnded = false; // Reset game state (game is now active)
    currentPlayer = "circle"; // Reset current player to Circle
    if (infoDisplay) { // Ensure infoDisplay is not null
        infoDisplay.innerHTML = "Circle goes first"; // Update info display
        console.log("RESTART_GAME: Info display reset.");
    }
    if (newGameBtn) { // Added a check
        newGameBtn.style.display = "none"; // Hide "New Game" button
        console.log("RESTART_GAME: New Game button hidden.");
    }

    // Clear all visual marks (X's and O's) from the squares on the board
    document.querySelectorAll('.square').forEach(cell => {
        cell.innerHTML = ''; // Remove any child elements (the 'x' or 'circle' divs) from each square
    });
    console.log("RESTART_GAME: Visual board cleared.");

    // Explicitly update the score display after a game reset.
    // This ensures the current, accumulated scores are always shown,
    // even if the last game didn't result in a score change.
    updateScoreDisplay();
    console.log("RESTART_GAME: updateScoreDisplay called at end of restartGame.");
}

// --- Ensure DOM is fully loaded before running game setup ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM_LOADED: DOMContentLoaded event fired.");
    // Assign DOM element references here, ensuring they exist
    gameBoard = document.querySelector("#gameboard");
    infoDisplay = document.getElementById("info");
    playerOCircleScoreSpan = document.getElementById('playerOCircleScore');
    playerXCrossScoreSpan = document.getElementById('playerXCrossScore');
    tiesScoreSpan = document.getElementById('tiesScore');
    newGameBtn = document.getElementById("newGameBtn");
    console.log("DOM_LOADED: DOM elements assigned:", { gameBoard, infoDisplay, playerOCircleScoreSpan, playerXCrossScoreSpan, tiesScoreSpan, newGameBtn });

    // Load scores from localStorage when the page first loads
    loadScores();

    // Initial update to display scores after loading them
    updateScoreDisplay();

    // Set initial info display text
    if (infoDisplay) { // Check before setting innerHTML
        infoDisplay.innerHTML = "Circle goes first";
    }

    // Call createBoard to set up the game board when the script loads
    createBoard();

    // Add event listener to the "New Game" button to restart the game
    if (newGameBtn) { // Added a check for the button before adding listener
        newGameBtn.addEventListener("click", restartGame);
        console.log("DOM_LOADED: New Game button event listener added.");
    } else {
        console.warn("DOM_LOADED: newGameBtn is null, event listener not added.");
    }
});

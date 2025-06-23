// --- DOM Element References ---
let gameBoard;
let infoDisplay;
let playerOCircleScoreSpan;
let playerXCrossScoreSpan;
let tiesScoreSpan;
let newGameBtn;
let xWinBurst; // Reference for the X-win burst element
let llmCommentaryDisplay; // NEW: Reference for LLM commentary text
let llmLoadingIndicator; // NEW: Reference for LLM loading indicator
let turnMessageDisplay; // NEW: Reference for the turn-based message display
let oWinEffect; // NEW: Reference for the O-win effect element
// --- Game State Variables ---
const boardState = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "circle"; // Game starts with "circle" (O)
let gameEnded = false; // Flag to indicate if the game has ended (win or draw)

// Scores for each player and ties, initialized to 0.
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
    const savedPlayerOCircleWins = localStorage.getItem(
      "ticTacToePlayerOCircleWins"
    );
    const savedPlayerXCrossWins = localStorage.getItem(
      "ticTacToePlayerXCrossWins"
    );
    const savedTies = localStorage.getItem("ticTacToeTies");

    playerOCircleWins = savedPlayerOCircleWins
      ? parseInt(savedPlayerOCircleWins)
      : 0;
    playerXCrossWins = savedPlayerXCrossWins
      ? parseInt(savedPlayerXCrossWins)
      : 0;
    ties = savedTies ? parseInt(savedTies) : 0;

    console.log("LOAD_SCORES: Scores loaded:", {
      playerOCircleWins,
      playerXCrossWins,
      ties,
    });
  } catch (e) {
    console.error("LOAD_SCORES: Error loading scores from localStorage:", e);
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
    localStorage.setItem(
      "ticTacToePlayerOCircleWins",
      playerOCircleWins.toString()
    );
    localStorage.setItem(
      "ticTacToePlayerXCrossWins",
      playerXCrossWins.toString()
    );
    localStorage.setItem("ticTacToeTies", ties.toString());
    console.log("SAVE_SCORES: Scores saved:", {
      playerOCircleWins,
      playerXCrossWins,
      ties,
    });
  } catch (e) {
    console.error("SAVE_SCORES: Error saving scores to localStorage:", e);
  }
}

/**
 * Updates the score display spans in the HTML with the current win and tie counts.
 */
function updateScoreDisplay() {
  console.log("UPDATE_DISPLAY: Attempting to update scores with values:", {
    playerOCircleWins,
    playerXCrossWins,
    ties,
  });
  if (playerOCircleScoreSpan) {
    playerOCircleScoreSpan.textContent = playerOCircleWins;
    console.log(
      "UPDATE_DISPLAY: Player Circle Score Span updated to:",
      playerOCircleScoreSpan.textContent
    );
  } else {
    console.warn(
      "UPDATE_DISPLAY: playerOCircleScoreSpan is null or undefined. Cannot update score."
    );
  }
  if (playerXCrossScoreSpan) {
    playerXCrossScoreSpan.textContent = playerXCrossWins;
    console.log(
      "UPDATE_DISPLAY: Player Cross Score Span updated to:",
      playerXCrossScoreSpan.textContent
    );
  } else {
    console.warn(
      "UPDATE_DISPLAY: playerXCrossScoreSpan is null or undefined. Cannot update score."
    );
  }
  if (tiesScoreSpan) {
    tiesScoreSpan.textContent = ties;
    console.log(
      "UPDATE_DISPLAY: Ties Score Span updated to:",
      tiesScoreSpan.textContent
    );
  } else {
    console.warn(
      "UPDATE_DISPLAY: tiesScoreSpan is null or undefined. Cannot update score."
    );
  }
}

// Winning combinations (indices of cells)
const winningConditions = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // Rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // Columns
  [0, 4, 8],
  [2, 4, 6], // Diagonals
];

/**
 * Initializes or resets the game board by dynamically creating square elements.
 * Each square is given a 'square' class and a 'data-id' for tracking.
 */
function createBoard() {
  // Hide the "New Game" button at the start of a new game round
  if (newGameBtn) {
    newGameBtn.style.display = "none";
    console.log("CREATE_BOARD: New Game button hidden.");
  } else {
    console.warn("CREATE_BOARD: newGameBtn is null, cannot hide.");
  }

  // Clear any existing squares from the gameBoard div (important for restarting)
  if (gameBoard) {
    gameBoard.innerHTML = "";
    console.log("CREATE_BOARD: Game board cleared.");
  } else {
    console.error("CREATE_BOARD: gameBoard element not found!");
    return;
  }

  // Loop 9 times to create each of the Tic-Tac-Toe squares
  boardState.forEach((_cellValue, index) => {
    const cellElement = document.createElement("div");
    cellElement.classList.add("square");
    cellElement.dataset.id = index;
    cellElement.addEventListener("click", handleCellClick);
    gameBoard.append(cellElement);
  });
  console.log("CREATE_BOARD: 9 squares created and added to the board.");
  updateTurnMessage(`${capitalizePlayerName(currentPlayer)} goes first!`); // Initial message
}

/**
 * Handles a click event on a game square.
 * Updates game state, places player mark, and checks for win/draw.
 * @param {Event} event The click event object.
 */
async function handleCellClick(event) {
  const clickedCell = event.target;
  const clickedCellId = parseInt(clickedCell.dataset.id);
  console.log(
    `HANDLE_CLICK: Cell ${clickedCellId} clicked by ${currentPlayer}.`
  );

  if (boardState[clickedCellId] !== "" || gameEnded) {
    console.log("HANDLE_CLICK: Invalid move - cell occupied or game ended.");
    return;
  }

  boardState[clickedCellId] = currentPlayer;
  const playerMark = document.createElement("div");
  playerMark.classList.add(currentPlayer);
  // Add animation class
  playerMark.classList.add("fade-in-scale");
  clickedCell.append(playerMark);
  console.log(
    `HANDLE_CLICK: Placed ${currentPlayer} mark on cell ${clickedCellId}.`
  );

  if (checkForWin()) {
    await handleWin();
  } else if (checkForDraw()) {
    await handleDraw();
  } else {
    switchPlayer();
  }
}

/**
 * Handles logic when a player wins.
 */
// tictactoe.js

/**
 * Handles logic when a player wins.
 */
async function handleWin() {
    console.log("HANDLE_CLICK: Win detected!");
    gameEnded = true;

    let outcomeMessage = "";
    let winnerPlayer = "";

    // This is the SINGLE, correct block for win logic
    if (currentPlayer === "circle") {
        playerOCircleWins++;
        document.body.classList.add("o-win-background");
        if (oWinEffect) { // Correctly placed O-win effect activation
            oWinEffect.classList.add("active");
        }
        outcomeMessage = "Player Circle won";
        winnerPlayer = "Circle";
    } else { // currentPlayer === "x"
        playerXCrossWins++;
        if (xWinBurst) {
            xWinBurst.classList.add("active");
        }
        outcomeMessage = "Player Cross won";
        winnerPlayer = "Cross";
    }

    if (infoDisplay) {
        infoDisplay.innerHTML = `${winnerPlayer} is the winner!`;
        infoDisplay.classList.add("flash-text"); // Add class for flashing
    }
    updateTurnMessage(`${winnerPlayer} wins! Game over!`); // Update turn message
    console.log("HANDLE_CLICK: Scores incremented.", {
        playerOCircleWins,
        playerXCrossWins,
    });
    updateScoreDisplay();
    saveScores();
    if (newGameBtn) {
        newGameBtn.style.display = "inline";
    }

    // The API call uses the correctly set outcomeMessage
    await generateGameCommentary(outcomeMessage);
}


/**
 * Handles logic when the game is a draw.
 */
async function handleDraw() {
  console.log("HANDLE_CLICK: Draw detected!");
  if (infoDisplay) {
    infoDisplay.innerHTML = "It's a draw!";
    infoDisplay.classList.add("flash-text"); // Add class for flashing
  }
  gameEnded = true;

  ties++;
  let outcomeMessage = "It was a tie";
  updateTurnMessage(`It's a tie! No winner this round.`); // Update turn message

  console.log("HANDLE_CLICK: Ties incremented.", { ties });
  updateScoreDisplay();
  saveScores();
  if (newGameBtn) {
    newGameBtn.style.display = "inline";
  }

  await generateGameCommentary(outcomeMessage);
}

/**
 * Switches the current player and updates the info display.
 */
function switchPlayer() {
  currentPlayer = currentPlayer === "circle" ? "x" : "circle";
  if (infoDisplay) {
    infoDisplay.textContent = `It is now ${capitalizePlayerName(
      currentPlayer
    )}'s turn`;
  }
  updateTurnMessage(`It's ${capitalizePlayerName(currentPlayer)}'s turn!`); // Update turn message
  console.log("HANDLE_CLICK: Switched turn to:", currentPlayer);
}

/**
 * Helper function to capitalize player names for display.
 */
function capitalizePlayerName(player) {
  return player.charAt(0).toUpperCase() + player.slice(1);
}

/**
 * NEW: Displays a message in the designated turn message area with a fade effect.
 * @param {string} message The message to display.
 */
function updateTurnMessage(message) {
  if (turnMessageDisplay) {
    turnMessageDisplay.classList.remove("fade-in-out"); // Remove to re-trigger animation
    const _ = turnMessageDisplay.offsetWidth; // Trigger reflow
    turnMessageDisplay.textContent = message;
    turnMessageDisplay.classList.add("fade-in-out");
  } else {
    console.warn(
      "UPDATE_TURN_MESSAGE: turnMessageDisplay is null. Cannot update message."
    );
  }
}

/**
 *  Generates game commentary using the Gemini API (LLM).
 * @param {string} outcomeDescription A description of the game's outcome (e.g., "Player X won", "It was a tie").
 */
async function generateGameCommentary(outcomeDescription) {
  if (!llmCommentaryDisplay || !llmLoadingIndicator) {
    console.warn(
      "LLM Commentary display elements not found. Skipping commentary generation."
    );
    return;
  }

  llmCommentaryDisplay.textContent = ""; // Clear previous commentary
  llmLoadingIndicator.classList.remove("hidden"); // Show loading indicator
  console.log("GENERATE_COMMENTARY: Generating commentary...");

  const prompt = `The Tic-Tac-Toe game just ended. Outcome: ${outcomeDescription}. Give a very short, cheerful, and slightly witty comment about this game's outcome. Keep it under 20 words.`;

  let chatHistory = [];
  chatHistory.push({ role: "user", parts: [{ text: prompt }] });

  const payload = { contents: chatHistory };
  const apiKey = "AIzaSyD--HSCi-IrTk-u708ID-CI8edXEkbZmX0"; // REMOVED: Do not hardcode API keys in client-side code
  //const apiKey = window.GEMINI_API_KEY || ""; // Retrieve API key securely (set via environment or injected at runtime)

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (
      result.candidates?.length > 0 &&
      result.candidates[0].content?.parts?.length > 0
    ) {
      const text = result.candidates[0].content.parts[0].text;
      llmCommentaryDisplay.textContent = `✨ ${text}`; // Add sparkle emoji!
      console.log("GENERATE_COMMENTARY: LLM commentary received:", text);
    } else {
      llmCommentaryDisplay.textContent = "✨ A thrilling game, indeed!"; // Fallback
      console.warn(
        "GENERATE_COMMENTARY: LLM response structure unexpected or empty."
      );
    }
  } catch (error) {
    llmCommentaryDisplay.textContent =
      "✨ Well played! (Commentary AI is resting)"; // Error fallback
    console.error("GENERATE_COMMENTARY: Error calling Gemini API:", error);
  } finally {
    llmLoadingIndicator.classList.add("hidden"); // Hide loading indicator
  }
}

/**
 * Checks if the current player has achieved a winning combination.
 * @returns {boolean} True if the current player has won, false otherwise.
 */
function checkForWin() {
  return winningConditions.some((combination) => {
    const [a, b, c] = combination;
    return (
      boardState[a] === currentPlayer &&
      boardState[b] === currentPlayer &&
      boardState[c] === currentPlayer
    );
  });
}

/**
 * Checks if the game is a draw.
 * A draw occurs if no player has won and all cells are filled.
 * @returns {boolean} True if the game is a draw, false otherwise.
 */
function checkForDraw() {
  return !boardState.includes("");
}

/**
 * Resets the game to its initial state for a new round (scores are preserved).
 * Clears the board, resets player turn, hides "New Game" button, and updates info display.
 */
function restartGame() {
  console.log("RESTART_GAME: Starting game restart process.");
  boardState.fill("");
  gameEnded = false;
  currentPlayer = "circle";
  if (infoDisplay) {
    infoDisplay.innerHTML = "Circle goes first";
    infoDisplay.classList.remove("flash-text"); // Remove flash class on restart
    console.log("RESTART_GAME: Info display reset.");
  }
  if (newGameBtn) {
    newGameBtn.style.display = "none";
    console.log("RESTART_GAME: New Game button hidden.");
  }

  // Remove animation classes when restarting the game
  document.body.classList.remove("o-win-background");
  if (xWinBurst) {
    xWinBurst.classList.remove("active");
    const _ = xWinBurst.offsetWidth; // Trigger reflow to reset animation
    console.log("RESTART_GAME: Animation classes removed.");
  }

  // NEW: Clear LLM commentary when restarting
  if (llmCommentaryDisplay) {
    llmCommentaryDisplay.textContent = "";
  }
  if (llmLoadingIndicator) {
    llmLoadingIndicator.classList.add("hidden");
  }
  console.log("RESTART_GAME: LLM commentary cleared.");

  document.querySelectorAll(".square").forEach((cell) => {
    cell.innerHTML = "";
  });
  console.log("RESTART_GAME: Visual board cleared.");

  updateScoreDisplay();
  updateTurnMessage(`${capitalizePlayerName(currentPlayer)}'s turn!`); // Reset turn message
  console.log("RESTART_GAME: updateScoreDisplay called at end of restartGame.");
}

// --- Ensure DOM is fully loaded before running game setup ---
document.addEventListener("DOMContentLoaded", () => {
  oWinEffect = document.getElementById("oWinEffect");
  console.log("DOM_LOADED: DOMContentLoaded event fired.");
  // Assign DOM element references here, ensuring they exist
  gameBoard = document.querySelector("#gameboard");
  infoDisplay = document.getElementById("info");
  playerOCircleScoreSpan = document.getElementById("playerOCircleScore");
  playerXCrossScoreSpan = document.getElementById("playerXCrossScore");
  tiesScoreSpan = document.getElementById("tiesScore");
  newGameBtn = document.getElementById("newGameBtn");
  xWinBurst = document.getElementById("xWinBurst");
  llmCommentaryDisplay = document.getElementById("llmCommentaryDisplay"); // NEW: Assign LLM commentary display
  llmLoadingIndicator = document.getElementById("llmLoadingIndicator"); // NEW: Assign LLM loading indicator
  turnMessageDisplay = document.getElementById("turnMessage"); // NEW: Assign turn message display
  console.log("DOM_LOADED: DOM elements assigned:", {
    gameBoard,
    infoDisplay,
    playerOCircleScoreSpan,
    playerXCrossScoreSpan,
    tiesScoreSpan,
    newGameBtn,
    xWinBurst,
    llmCommentaryDisplay,
    llmLoadingIndicator,
    turnMessageDisplay, // Log the new element
  });

  // Load scores from localStorage when the page first loads
  loadScores();

  // Initial update to display scores after loading them
  updateScoreDisplay();

  // Set initial info display text - this will now be handled by updateTurnMessage
  // if (infoDisplay) {
  //   infoDisplay.innerHTML = "Circle goes first";
  // }

  // Call createBoard to set up the game board when the script loads
  createBoard();

  // Add event listener to the "New Game" button to restart the game
  if (newGameBtn) {
    newGameBtn.addEventListener("click", restartGame);
    console.log("DOM_LOADED: New Game button event listener added.");
  } else {
    console.warn("DOM_LOADED: newGameBtn is null, event listener not added.");
  }
});

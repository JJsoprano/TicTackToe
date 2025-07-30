const socket = io(); // This line connects your client to the Socket.IO

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
let oWinEffect; // o wins
let clearScoresBtn;
let joinGameSection;
let createGameBtn;
let joinGameInput;
let joinGameBtn;
let roomInfoDisplay;
let lobbyMessageDisplay; // need for the code
// --- Game State Variables ---
const boardState = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "circle"; // Game starts with "circle" (O)
let gameEnded = false; // Flag to indicate if the game has ended (win or draw)

// Scores for each player and ties, initialized to 0.
let playerOCircleWins = 0;
let playerXCrossWins = 0;
let ties = 0;

let myPlayerType =null;
let currentRoomId = null;
// ... existing DOM Element References ...
let chatMessagesDisplay; // For displaying messages
let chatInput;          // For typing messages
let sendChatBtn;        // For the send button

// --- Functions ---

/**
 * Loads scores from localStorage.
 * If no scores are found, initializes them to 0.
 */
// --- NEW: Chat Functions ---

/**
 * Sends a chat message to the server.
 */
function sendChatMessage() {
    if (!currentRoomId) {
        updateLobbyMessage("You must be in a game to chat.");
        return;
    }
    const message = chatInput.value.trim();
    if (message) {
        // Emit the message along with the current room ID and player type
        socket.emit('chatMessage', { roomId: currentRoomId, message: message, senderType: myPlayerType });
        chatInput.value = ''; // Clear input field
        // We will let the server broadcast the message back to us,
        // so we don't append it locally here to ensure consistency.
    }
}

/**
 * Appends a chat message to the display area.
 * @param {string} message The text message to display.
 * @param {string} messageClass A class for styling (e.g., 'my-message', 'opponent-message', 'system-message').
 */
function appendChatMessage(message, messageClass = 'system-message') {
    if (!chatMessagesDisplay) {
        console.warn("appendChatMessage: chatMessagesDisplay not found.");
        return;
    }
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', messageClass);
    messageElement.textContent = message;
    chatMessagesDisplay.appendChild(messageElement);
    // Scroll to the bottom of the chat display
    chatMessagesDisplay.scrollTop = chatMessagesDisplay.scrollHeight;
}
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
function clearScores() {
  playerOCircleWins = 0;
  playerXCrossWins = 0;
  ties = 0;
  updateScoreDisplay(); // Update the displayed scores to 0
  saveScores(); // Save these 0 scores to localStorage
  // Provide a quick message to the player
  updateTurnMessage("All scores reset!");
  console.log("CLEAR_SCORES: All game scores have been cleared.");
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
    if (oWinEffect) {
      // Correctly placed O-win effect activation
      oWinEffect.classList.add("active");
    }
    outcomeMessage = "Player Circle won";
    winnerPlayer = "Circle";
  } else {
    // currentPlayer === "x"
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
 * Displays messages in the lobby info area.
 * @param {string} message The message to display.
 */
function updateLobbyMessage(message) {
    if (lobbyMessageDisplay) {
        lobbyMessageDisplay.textContent = message;
    }
}
/*** Handles logic when the game is a draw*/
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
}
/*** Handles logic when the game is a draw*/
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
 * Helper function to capitalize player names for display
 */
function capitalizePlayerName(player) {
  return player.charAt(0).toUpperCase() + player.slice(1);
}

/**
 *  Displays a message in the designated turn message area with a fade effect.
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
// (Removed duplicate DOMContentLoaded handler. All DOM assignments and event listeners are handled in the main DOMContentLoaded at the bottom.)
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
  const apiKey = "AIzaSyD--HSCi-IrTk-u708ID-CI8edXEkbZmX0";

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
      llmCommentaryDisplay.textContent = "✨ A thrilling game, indeed!"; // Fallback message
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
/*
 * Checks if the game is a draw.
 * A draw occurs if no player has won and all cells are filled.
 * @returns {boolean} True if the game is a draw, false otherwise.
 */
function checkForDraw() {
  return !boardState.includes("") && !checkForWin();
}

/**
 * Resets the game to its initial state for a new round (scores are preserved).
 */
function restartGame() {
  console.log("RESTART_GAME: Starting game restart process.");
  boardState.fill("");
  gameEnded = false;
  currentPlayer = "circle";
  if (infoDisplay) {
    infoDisplay.innerHTML = "Circle goes first";
    infoDisplay.classList.remove("flash-text");
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

  // Re-create the board to ensure event listeners are attached
  createBoard();
  console.log("RESTART_GAME: Board re-created.");

  updateScoreDisplay();
  updateTurnMessage(`${capitalizePlayerName(currentPlayer)}'s turn!`); // Reset turn message
  console.log("RESTART_GAME: updateScoreDisplay called at end of restartGame.");
}

//  Ensure DOM is fully loaded before running game setup
document.addEventListener("DOMContentLoaded", () => {
  oWinEffect = document.getElementById("oWinEffect");
  console.log("DOM_LOADED: DOMContentLoaded event fired.");
  // NEW: Chat elements
    chatMessagesDisplay = document.getElementById("chat-messages");
    chatInput = document.getElementById("chat-input");
    sendChatBtn = document.getElementById("send-chat-btn");

    console.log("DOM_LOADED: Chat elements assigned:", {
        // ... existing logs ...
        chatMessagesDisplay, chatInput, sendChatBtn
    });

    // Event listener for sending messages
    if (sendChatBtn) {
        sendChatBtn.addEventListener("click", sendChatMessage);
    }
    if (chatInput) {
        // Allow sending by pressing Enter key
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    // ... rest of your DOMContentLoaded code ...
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
    clearScoresBtn = document.getElementById("clearScoresBtn"); // Assign clearScoresBtn reference
    // Assign additional DOM elements outside the object
    joinGameSection = document.getElementById("joinGameSection");
    createGameBtn = document.getElementById("createGameBtn");
    joinGameInput = document.getElementById("joinGameInput");
    joinGameBtn = document.getElementById("joinGameBtn");
    roomInfoDisplay = document.getElementById("roomInfo");
  
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
      turnMessageDisplay,
      clearScoresBtn,
      joinGameSection,
      createGameBtn,
      joinGameInput,
      joinGameBtn,
      roomInfoDisplay
    });
  
    // Event listeners
    if (newGameBtn) {
        newGameBtn.addEventListener("click", restartGame);
    }
    if (clearScoresBtn) {
        clearScoresBtn.addEventListener("click", clearScores);
    }
  
    // NEW: Join/Create Game Button Listeners
    if (createGameBtn) {
        createGameBtn.addEventListener("click", () => {
            socket.emit('joinGame', null); // null indicates a new game
            updateTurnMessage("Creating new game...");
            if (joinGameSection) joinGameSection.style.display = 'none'; // Hide join section
        });
    }
    if (joinGameBtn) {
        joinGameBtn.addEventListener("click", () => {
            const roomId = joinGameInput.value.trim();
            if (roomId) {
                socket.emit('joinGame', roomId);
                updateTurnMessage(`Joining room ${roomId}...`);
                if (joinGameSection) joinGameSection.style.display = 'none'; // Hide join section
            } else {
                updateTurnMessage("Please enter a Room ID.");
            }
        });
    }
  
    console.log("DOM_LOADED: DOM elements assigned.");
  
    loadScores();
    updateScoreDisplay();
    createBoard(); // Initial board creation, but i
    // (Removed duplicate calls to loadScores, updateScoreDisplay, and createBoard. These are now only called inside DOMContentLoaded.)
});
  // --- NEW: Listener for Game Updates from Server ---
  socket.on("gameUpdate", async (data) => {
    console.log("CLIENT: Received game update from server:", data);

    const cellId = data.cellId;
    const player = data.player;

    // Apply the move to the local board if the cell is currently empty
    // (This client-side check provides immediate feedback, but server is authoritative)
    if (boardState[cellId] === "") {
      boardState[cellId] = player; // Update local board state
      const cellElement = gameBoard.querySelector(`[data-id="${cellId}"]`);
      if (cellElement) {
        const playerMark = document.createElement("div");
        playerMark.classList.add(player);
        playerMark.classList.add("fade-in-scale");
        cellElement.append(playerMark);
      }
    }

    // In a full multiplayer game, the server would send explicit
    // messages for 'turn_changed', 'game_won', 'game_draw'.
    // For now, we'll keep the logic here to make the game playable
    // across tabs/devices, but be aware this is NOT authoritative.

    // Switch player locally after receiving and applying a move from server
    currentPlayer = player === "circle" ? "x" : "circle";
    updateTurnMessage(`It's ${capitalizePlayerName(currentPlayer)}'s turn!`);

    // Perform local win/draw checks, but remember the server will be the ultimate decider
    if (checkForWin()) {
      handleWin(); // This call will eventually come from the server
      console.log(
        "CLIENT: Local win detected, but awaiting server confirmation."
      );
    } else if (checkForDraw()) {
      await handleDraw(); // This call will eventually come from the server
      console.log(
        "CLIENT: Local draw detected, but awaiting server confirmation."
      );
    }
  });

  // --- NEW/ Socket connection status messages (for debugging) ---
  socket.on("connect", () => {
    console.log("SOCKET: Connected to server with ID:", socket.id);
    updateTurnMessage("Connected to game server!");
  });

  socket.on("disconnect", () => {
    console.log("SOCKET: Disconnected from server");
    updateTurnMessage("Disconnected from game server!");
  });

  socket.on("connect_error", (err) => {
    console.error("SOCKET: Connection Error:", err);
    updateTurnMessage("Connection error! Server down?");
  });

  // Fired when the client successfully connects to the Socket.IO server
  socket.on('connect', () => {
      console.log('SOCKET: Connected to server with ID:', socket.id);
      updateTurnMessage("Connected to game server. Join or create a game!");
      if (joinGameSection) joinGameSection.style.display = 'block'; // Ensure join section is visible on connect
  });

  // Fired when the client disconnects from the Socket.IO server
  socket.on('disconnect', () => {
      console.log('SOCKET: Disconnected from server');
      updateTurnMessage("Disconnected from game server! Refresh to reconnect.");
      if (joinGameSection) joinGameSection.style.display = 'block'; // Show join section again
      if (gameBoard) { // Optionally disable board interactions if disconnected
          gameBoard.style.pointerEvents = 'none';
          gameBoard.style.opacity = 0.5;
      }
      if (roomInfoDisplay) roomInfoDisplay.textContent = ''; // Clear room info
      myPlayerType = null; // Reset player type
      currentRoomId = null; // Reset room ID
  });

  // Fired when there's a connection error (e.g., server not running)
  socket.on('connect_error', (err) => {
      console.error('SOCKET: Connection Error:', err);
      updateTurnMessage("Connection error! Is the server running?");
      if (joinGameSection) joinGameSection.style.display = 'block'; // Show join section on error
  });

  // NEW//Received when client successfully joins a room
  socket.on('joinedRoom', (data) => {
      myPlayerType = data.playerType;
      currentRoomId = data.roomId;
      roomInfoDisplay.textContent = `Room ID: ${currentRoomId} | You are Player ${capitalizePlayerName(myPlayerType)}`;
      console.log(`CLIENT: Joined room ${data.roomId} as ${data.playerType}`);
      updateTurnMessage(`Joined game as Player ${capitalizePlayerName(myPlayerType)}!`);
      if (gameBoard) gameBoard.style.pointerEvents = 'auto'; // Enable board
      if (newGameBtn) newGameBtn.style.display = 'none'; // Hide restart initially
  });

  // NEW// Received when a game starts (2 players joined)
  socket.on('gameStart', (data) => {
      renderBoard(data.board); // Initial board state from server
      currentPlayer = data.currentPlayer;
      gameEnded = false;
      infoDisplay.innerHTML = ''; // Clear info display
      infoDisplay.classList.remove("flash-text");
      if (roomInfoDisplay) roomInfoDisplay.textContent = `Room ID: ${currentRoomId} | You are Player ${capitalizePlayerName(myPlayerType)}`;

      if (myPlayerType === currentPlayer) {
          updateTurnMessage("Your turn!");
      } else {
          updateTurnMessage(`Opponent's turn (${capitalizePlayerName(currentPlayer)})`);
      }
      console.log(`CLIENT: Game started. Current player: ${currentPlayer}`);
  });

  // NEW// Received whenever game state updates (after a move, or win/draw)
  socket.on('gameStateUpdate', (data) => {
      console.log('CLIENT: Received gameStateUpdate from server:', data);

      // Update client's game state based on server's data
      renderBoard(data.board);
      currentPlayer = data.currentPlayer;
      gameEnded = data.gameEnded;

      // Reset visual effects
      document.body.classList.remove("o-win-background");
      if (oWinEffect) oWinEffect.classList.remove("active");
      if (xWinBurst) xWinBurst.classList.remove("active");
      if (infoDisplay) infoDisplay.classList.remove("flash-text");

      if (data.gameEnded) {
          handleGameEnd(data.message, data.winner); // Trigger game end visuals and score update
      } else {
          if (myPlayerType === currentPlayer) {
              updateTurnMessage("Your turn!");
          } else {
              updateTurnMessage(`Opponent's turn (${capitalizePlayerName(currentPlayer)})`);
          }
      }
  });

  // NEW: Received when game is restarted by server
  socket.on('gameRestarted', (data) => {
      console.log('CLIENT: Game restarted by server.');
      renderBoard(data.board);
      currentPlayer = data.currentPlayer;
      gameEnded = data.gameEnded;

      // Reset client-side game state (scores are preserved by clearScoresBtn if used)
      document.body.classList.remove("o-win-background");
      if (oWinEffect) oWinEffect.classList.remove("active");
      if (xWinBurst) xWinBurst.classList.remove("active");
      if (infoDisplay) {
          infoDisplay.innerHTML = ''; // Clear info display
          infoDisplay.classList.remove("flash-text");
      }
      llmCommentaryDisplay.textContent = "";
      llmLoadingIndicator.classList.add("hidden");
      updateTurnMessage(`Game restarted! ${capitalizePlayerName(currentPlayer)} goes first!`);
      if (newGameBtn) newGameBtn.style.display = 'none'; // Hide restart button until next end game
  });

// Handle opponent disconnection
socket.on('opponentDisconnected', (message) => {
    console.log('CLIENT: Opponent disconnected:', message);
    gameEnded = true; // End the current game
    updateLobbyMessage(message); // Display in lobby messages
    updateTurnMessage("Opponent disconnected! Game ended.");
    if (infoDisplay) infoDisplay.innerHTML = "Opponent disconnected!";
    if (newGameBtn) newGameBtn.style.display = 'inline'; // Allow current player to restart or wait
    if (gameBoard) {
        gameBoard.style.pointerEvents = 'none'; // Disable board
        gameBoard.style.opacity = 0.5;
    }
});

// Handle server errors (e.g., room full, room not found)
socket.on('gameError', (message) => {
    console.error('CLIENT: Game Error:', message);
    updateLobbyMessage(`Error: ${message}`);
    updateTurnMessage(`Error: ${message}`);
    if (joinGameSection) joinGameSection.style.display = 'block'; // Show join section on error
    if (gameBoard) {
        gameBoard.style.pointerEvents = 'none'; // Disable board
        gameBoard.style.opacity = 0.5;
    }
})
// ... existing socket.on listeners ...

// NEW: Received when a chat message is sent
socket.on('chatMessage', (data) => {
    console.log('CLIENT: Received chat message:', data);
    const senderName = capitalizePlayerName(data.senderType);
    let prefix = '';
    let messageClass = 'system-message'; // Default

    if (data.senderId === socket.id) { // This is my own message
        prefix = 'You';
        messageClass = 'my-message';
    } else if (data.senderType) { // This is an opponent's message
        prefix = senderName;
        messageClass = 'opponent-message';
    }

    appendChatMessage(`${prefix}: ${data.message}`, messageClass);
});

// ... rest of your socket.on listeners ...;

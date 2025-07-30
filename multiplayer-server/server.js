// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the parent directory (your TICTACTOE folder)
app.use(express.static(path.join(__dirname, '..')));

// --- Server-side Game State Management ---
const games = {}; // Stores active games, key: roomId, value: game object

// Winning combinations (same as client, but authoritative on server)
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]  // Diagonals
];

// Helper to generate a unique room ID
function generateRoomId() {
    return Math.random().toString(36).substring(2, 9);
}

// Check for win on the server
function checkForWin(board, player) {
    return winningConditions.some(combination => {
        const [a, b, c] = combination;
        return board[a] === player && board[b] === player && board[c] === player;
    });
}

// Check for draw on the server
function checkForDraw(board) {
    return !board.includes("");
}

io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    let currentRoomId = null; // Store the room the socket is currently in

    // --- NEW: Client wants to create or join a game ---
    socket.on('joinGame', (roomId) => {
        if (!roomId) { // Client wants to create a new game
            roomId = generateRoomId();
            games[roomId] = {
                players: {}, // Stores socket IDs and their player type ('circle' or 'x')
                board: ["", "", "", "", "", "", "", "", ""],
                currentPlayer: 'circle',
                gameEnded: false,
                playerCount: 0
            };
            console.log(`Server: Created new room: ${roomId}`);
        }

        let game = games[roomId];

        if (!game) {
            socket.emit('gameError', 'Room does not exist!');
            console.log(`Server: Room ${roomId} requested but not found.`);
            return;
        }

        if (game.playerCount >= 2) {
            socket.emit('gameError', 'Room is full!');
            console.log(`Server: Room ${roomId} is full.`);
            return;
        }

        // Assign player type and join room
        const playerType = game.playerCount === 0 ? 'circle' : 'x';
        game.players[socket.id] = playerType;
        game.playerCount++;
        currentRoomId = roomId; // Assign socket to this room

        socket.join(roomId); // Join the Socket.IO room
        socket.emit('joinedRoom', { roomId, playerType });
        console.log(`Server: User ${socket.id} joined room ${roomId} as ${playerType}. Player count: ${game.playerCount}`);

        // If room is full, start the game (or signal both players are ready)
        if (game.playerCount === 2) {
            io.to(roomId).emit('gameStart', {
                board: game.board,
                currentPlayer: game.currentPlayer,
                message: `Game started! Circle vs X in room ${roomId}`
            });
            console.log(`Server: Game started in room ${roomId}`);
        } else {
            // Inform the first player they are waiting for an opponent
            socket.emit('gameStart', {
                board: game.board,
                currentPlayer: game.currentPlayer,
                message: `Waiting for opponent in room ${roomId}. Share ID: ${roomId}`
            });
        }
    });

    // --- NEW: Client makes a move ---
    socket.on('makeMove', (data) => {
        if (!currentRoomId || !games[currentRoomId]) {
            socket.emit('gameError', 'Not in a valid game room.');
            return;
        }

        const game = games[currentRoomId];
        const { cellId } = data;
        const playerMakingMove = game.players[socket.id];

        // Server-side validation
        if (game.gameEnded) {
            socket.emit('gameError', 'Game has already ended.');
            return;
        }
        if (playerMakingMove !== game.currentPlayer) {
            socket.emit('gameError', 'It is not your turn!');
            return;
        }
        if (game.board[cellId] !== "") {
            socket.emit('gameError', 'Cell is already occupied!');
            return;
        }
        if (cellId < 0 || cellId > 8) {
             socket.emit('gameError', 'Invalid cell ID.');
             return;
        }


        // Apply the move
        game.board[cellId] = playerMakingMove;
        console.log(`Server: Move made in room ${currentRoomId} by ${playerMakingMove} at cell ${cellId}`);

        // Check for win/draw
        if (checkForWin(game.board, game.currentPlayer)) {
            game.gameEnded = true;
            io.to(currentRoomId).emit('gameStateUpdate', {
                board: game.board,
                currentPlayer: game.currentPlayer, // The winner
                gameEnded: true,
                winner: game.currentPlayer,
                message: `${capitalizePlayerName(game.currentPlayer)} won!`
            });
            console.log(`Server: ${game.currentPlayer} won in room ${currentRoomId}`);
        } else if (checkForDraw(game.board)) {
            game.gameEnded = true;
            io.to(currentRoomId).emit('gameStateUpdate', {
                board: game.board,
                currentPlayer: game.currentPlayer, // Last player to move
                gameEnded: true,
                draw: true,
                message: `It's a draw!`
            });
            console.log(`Server: Game is a draw in room ${currentRoomId}`);
        } else {
            // Switch turn
            game.currentPlayer = game.currentPlayer === 'circle' ? 'x' : 'circle';
            io.to(currentRoomId).emit('gameStateUpdate', {
                board: game.board,
                currentPlayer: game.currentPlayer,
                gameEnded: false,
                message: `It's ${capitalizePlayerName(game.currentPlayer)}'s turn!`
            });
            console.log(`Server: Turn switched to ${game.currentPlayer} in room ${currentRoomId}`);
        }
    });

    // --- NEW: Client wants to restart the game ---
    socket.on('restartGameRequest', () => {
        if (!currentRoomId || !games[currentRoomId]) {
            socket.emit('gameError', 'Not in a valid game room.');
            return;
        }

        const game = games[currentRoomId];
        game.board = ["", "", "", "", "", "", "", "", ""]; // Reset board
        game.currentPlayer = 'circle'; // Reset current player
        game.gameEnded = false; // Reset game status

        io.to(currentRoomId).emit('gameRestarted', {
            board: game.board,
            currentPlayer: game.currentPlayer,
            gameEnded: false,
            message: `Game restarted! ${capitalizePlayerName(game.currentPlayer)} goes first!`
        });
        console.log(`Server: Game in room ${currentRoomId} restarted.`);
    });
    // server.js

io.on('connection', (socket) => {
    // ... existing socket.on listeners (like 'joinGame', 'makeMove', 'restartGameRequest', 'disconnect') ...

    // --- NEW: Handle Chat Messages ---
    socket.on('chatMessage', (data) => {
        const { roomId, message, senderType } = data;
        
        // Ensure the sender is in a valid room
        if (!roomId || !games[roomId]) {
            socket.emit('gameError', 'Cannot send chat: Not in a valid game room.');
            return;
        }

        console.log(`Server: Chat message in room ${roomId} from ${socket.id} (${senderType}): ${message}`);

        // Broadcast the message to everyone in the room, including the sender
        io.to(roomId).emit('chatMessage', {
            message: message,
            senderType: senderType,
            senderId: socket.id // Send sender's socket ID so client can identify its own messages
        });
    });
});

    // --- Handle Disconnections ---
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        if (currentRoomId && games[currentRoomId]) {
            const game = games[currentRoomId];
            game.playerCount--;
            delete game.players[socket.id]; // Remove player from the game

            if (game.playerCount <= 0) {
                delete games[currentRoomId]; // Delete room if no players are left
                console.log(`Server: Room ${currentRoomId} deleted (no players left).`);
            } else {
                // If one player leaves, inform the other
                io.to(currentRoomId).emit('opponentDisconnected', 'Your opponent has disconnected. Waiting for a new player...');
                console.log(`Server: Opponent disconnected in room ${currentRoomId}. Remaining players: ${game.playerCount}`);
            }
        }
    });
});

// Helper function to capitalize player names
function capitalizePlayerName(player) {
    return player.charAt(0).toUpperCase() + player.slice(1);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
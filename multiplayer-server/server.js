// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path'); // Node.js module to handle file paths

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the directory where your HTML, CSS, JS are located.
// Assuming your index.html, style.css, tictactoe.js are in the parent directory
app.use(express.static(path.join(__dirname, '..'))); // Serves files from the parent directory

// --- Socket.IO Logic ---
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for a 'makeMove' event from a client
    socket.on('makeMove', (data) => {
        console.log(`Move received from ${socket.id}: cell ${data.cellId}, player ${data.player}`);

        // In a real game, the server would:
        // 1. Validate the move (Is it their turn? Is the cell empty?)
        // 2. Update its internal game board state.
        // 3. Check for win/draw conditions.
        // 4. Determine the next player's turn.

        // For now, let's just broadcast the move to ALL connected clients
        // (later, you'd broadcast only to clients in the same game room).
        io.emit('gameUpdate', data); // Sends the move data to everyone connected
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000; // Use port 3000, or environment variable
server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
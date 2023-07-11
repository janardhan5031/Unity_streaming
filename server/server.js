const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket_io = require("socket.io");

const users = {};

const socketToRoom = {};

const io = socket_io(server, {
  cors: {
    origin: "*", // Replace with the appropriate origin(s) of your frontend
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingInterval: 4000,
  pingTimeout: 2000,
});

io.on('connection', socket => {
    socket.on("join room", roomID => {
        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 4) {
                socket.emit("room full");
                return;
            }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id);

        socket.emit("all users", usersInThisRoom);
    });

    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected', socket.id)
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }
        socket.broadcast.emit('disconnect peer', socket.id)
    });

});

server.listen( 8000, () => console.log('server is running on port 8000'));



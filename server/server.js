const express = require("express");
const socket_io = require("socket.io");
const cors = require("cors");
const SimplePeer = require("simple-peer");

const app = express();

// cors.CorsOptions ={
//   origin:['*'],
// }

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
//   res.header(
//     "Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token"
//   );
//   next();
// });
// app.use(cors({ origin: "*", credentials: true }));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // to parse the data from form

app.get("/", (req, res) => {
  res.send("Hello world");
});

let server = require("http").Server(app);
server.listen(4000, (err) => {
  console.log("server is running at port 4000");
});

const io = socket_io(server, {
  cors: {
    origin: "*", // Replace with the appropriate origin(s) of your frontend
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingInterval: 4000,
  pingTimeout: 2000,
});

const nameSpace1 = io.of("/p2e");

let participants = {};

var rooms = [];

nameSpace1.on("connection", (socket) => {
  console.log("client connected ==> ", socket.id);

  // send the all active rooms
  socket.emit("get active rooms", { rooms });

  socket.on("create room", (payload) => {
    console.log(payload);
    const newRoom = {
      roomId: Date.now(),
      roomName: payload.roomName,
      hostId: payload.hostSocketId,
      participants: [],
    };
    rooms = [...rooms, newRoom];
    console.log(rooms);

    io.of("/p2e").emit("get active rooms", { rooms });
  });

  socket.on("join to room", (roomId) => {
    // join to the room
    socket.join(roomId);
    console.log(rooms, "====>");

    const activeRoom = rooms.find((r) => r.roomId === roomId);

    // tell all participants in the room to create new peer connection for this user
    activeRoom.participants.forEach((participant) => {
      socket.to(participant.socketId).emit("create_peer_at_participant_side", {
        connUserSocketId: socket.id,
      });
    });

    //update the participants in room
    const newParticipant = {
      socketId: socket.id,
    };
    rooms = rooms.filter((room) => room.roomId !== roomId);
    const updatedRoom = {
      ...activeRoom,
      participants: [...activeRoom.participants, newParticipant],
    };
    rooms.push(updatedRoom);
    // Check if the socket has joined the room
    const joinedRoom = Array.from(socket.rooms);
    if (joinedRoom.includes(roomId)) {
      console.log("Socket has joined the room.");
      socket.broadcast
        .to(roomId)
        .emit("joined the room", { userId: socket.id, roomId });
    } else {
      console.log("Socket has NOT joined the room.");
    }
  });

  socket.on("create_peer_at_newUser_side", (connUserSocketId) => {
    console.log("create_peer_at_newUser_side");
    socket.to(connUserSocketId).emit("create_peer_at_newUser_side", socket.id);
  });

  socket.on("connection_signal", ({ signal ,connUserSocketId}) => {
    console.log("connection_signal");
    socket
      .to(connUserSocketId)
      .emit("peer_signal", { signal, connUserSocketId: socket.id });
  });

  // exit from the room
  socket.on("exit from the room", (roomId) => {
    socket.leave(roomId);
    const rooms = Array.from(socket.rooms);
    if (rooms.includes(roomId)) {
      console.log("Unable to exit from the room ", roomId);
    } else {
      socket.broadcast
        .to(roomId)
        .emit("exited from the room", { userId: socket.id, roomId });
      console.log("Socket has NOT joined the room.");
    }
  });

  socket.on("send message", ({ message, roomId, userName }) => {
    console.log(message + " from " + userName);
    socket.broadcast.to(roomId).emit("recieve message from room", {
      message,
      userName,
      roomId,
    });
  });

  // on disconnect from servernewActiveRoom
  socket.on("disconnect", () => {
    console.log("client disconnect", socket.id);
    
    // get all rooms this user joined in
    
    io.of('/p2e').emit('participant_disconnected',{connUserSocketId:socket.id})
  });
});

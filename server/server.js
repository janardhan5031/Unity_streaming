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

const room1 = io.of("/p2e");

const offers = {};

room1.on("connection", (socket) => {
  console.log("client connected ==> ", socket.id);
  socket.send("socketId", socket.id);

  // recieving offer from peer connection
  socket.on("sending offer", (payload) => {
    console.log("offer received from " + socket.id);

    // sending offer to all connected peer to negotiate connection
    socket.broadcast.emit("recieving offer", { ...payload, userToPeer: socket.id });
  });

  socket.on("sending answer", (payload) => {
    console.log("answer received answer received", socket.id);

    // sending answer to all connected peer to negotiate connection
    socket.broadcast.emit('recieving answer', payload);
  });

  socket.on("iceCandidate", (payload) => {
    console.log('recieved iceCandidate from '+socket.id) 
    socket.broadcast.emit('recieved iceCandidate',payload)
  });

  // on disconnect from server
  socket.on("disconnect", () => {
    console.log(`client disconnected ===>`, socket.id);
    delete offers[socket.id];
    socket.broadcast.emit("iceCandidatesList", offers);
  });
});

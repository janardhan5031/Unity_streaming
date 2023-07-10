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

const users = {};

room1.on("connection", (socket) => {
  console.log('client connected ==> ',socket.id);
  
  socket.on('offer',offer=>{
    // console.log(offer,'===> offer')
    users[socket.id]=offer
    // console.log(users)
    socket.broadcast.emit('iceCandidate',{id:socket.id, offer})

  })

 

  // on disconnect from server
  socket.on("disconnect", () => {
    console.log(`client disconnected ===>` ,socket.id)
    console.log(users[socket.id])
    socket.broadcast.emit('removeIceCandidate',socket.id)
    delete users[socket.id]
  });


});

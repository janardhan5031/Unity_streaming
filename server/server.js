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
let admin, admin_offer; 

room1.on("connection", (socket) => {
  console.log('client connected ==> ',socket.id);
  console.log(socket.handshake.auth.userType)
  
  socket.on('send admin_offer',offer=>{
    // check if the user is admin, send his connection offer to all 
    // users in the room connected/ connecting ...
    // const userType = socket.handshake.auth.userType
    // if( userType === 'admin'){
    //   admin = userType ; 
    //   admin_offer =offer
    // }else{
      
    // }
    
    socket.broadcast.emit('recieve admin_offer',offer)

  })

  socket.on('streamId',(streamId)=>{
    if(!streams[socket.id]){
      streams[socket.id ] = streamId;
    }
  })

 

  // on disconnect from server
  socket.on("disconnect", () => {
    console.log(`client disconnected ===>` ,socket.id)
    delete offers[socket.id]
    socket.broadcast.emit('candidate disconnected',offers)
 
  });


});

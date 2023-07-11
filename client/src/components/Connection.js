import { useCallback, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import SimplePeer from "simple-peer";
import { io } from "socket.io-client";

const Connection = () => {
  const [mystream, setMyStream] = useState(null);
  const [remoteStream, setremoteStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const [socket, setSocket] = useState(null);
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    const connection = io("http://localhost:4000/p2e");
    // connect to socket server
    connection.on("connect", () => {
      console.log("client connected to socket server");
      setSocket(connection);
    });

    // connection.on('socketId',socketId=>setSocket(socketId));

    return () => {
      connection.disconnect();
      peer.destroy();
    };
  }, []);

  const callOnClickHandler = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setMyStream(stream);
  };

  useEffect(() => {
    if (mystream) {
      const peer = new SimplePeer({
        initiator: true,
        stream: mystream,
        trickle: false,
      });

      peer.on("signal", (offer) => {
        console.log(offer);
        socket.emit("offer", offer);
      });

      peer.on("stream", (stream) => {
        console.log(stream);
        setremoteStream(stream);
      });

      peer.on("close", () => {
        window.alert("Peer connection closed");
      });

      peer.on("error", (message) => {
        console.log(message);
        peer.removeStream(mystream);
      });

      setPeer(peer);
      return () => {
        peer.destroy(["Close"]);
      };
    }
  }, [mystream]);

  const handleIceCandidate = (iceCandidate) => {
    console.log(iceCandidate);
    peer.signal(iceCandidate);
  };

  const handleSocketId = (socketId) => {
    console.log(socketId);
    setSocketId(socketId);
  };

  const handleIceCandidatesList = (iceCandidates) => {
    console.log(iceCandidates, socketId);
    Object.keys(iceCandidates).forEach((key) => {
      if (key !== socketId) {
        peer.signal(iceCandidates[key]);
      }
    });
  };



  useEffect(() => {
    if (peer) {
      socket.on("iceCandidate", handleIceCandidate);
      socket.on("iceCandidatesList", handleIceCandidatesList);

      return () => {
        socket.off("iceCandidate", handleIceCandidate);
        socket.off("iceCandidatesList", handleIceCandidatesList);
      };
    }
  }, [
    peer,
    socket,
    handleIceCandidate,
    handleIceCandidatesList,
  ]);

  console.log(socketId);

  return (
    <>
      <button onClick={callOnClickHandler}>call</button>
      <div style={{ display: "flex", justifyContent: "center", gap: "3rem" }}>
        <div>
          <h3>MY Stream</h3>
          {mystream && (
            <ReactPlayer
              playing
              muted
              height="300px"
              width="500px"
              url={mystream}
            />
          )}
        </div>
        <div>
          <h3>Remote streams</h3>
          {remoteStream && (
            <ReactPlayer
              playing
              muted
              height="300px"
              width="500px"
              url={remoteStream}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Connection;

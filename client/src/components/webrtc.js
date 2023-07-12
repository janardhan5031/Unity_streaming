import ReactPlayer from "react-player";
import io from "socket.io-client";
import { useRef, useEffect, useState } from "react";

const socket = io("http://localhost:4000/p2e");

const PeerToPeer = () => {
  const peersRef = useRef([]);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setremoteStream] = useState(null);

  const createPeerConnection = () => {
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
    const peerConnection = new RTCPeerConnection(configuration);

    // Setup remote video stream event
    peerConnection.ontrack = (event) => {
      // Display remote video stream
      setremoteStream(event.streams[0]);
    };

    return peerConnection;
  };

  const handleOfferMessage = async (payload) => {
    // Set remote description
    const peerConnection = createPeerConnection();
    await peerConnection.setRemoteDescription(payload.offer);

    // Create and send an answer to the remote peer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    const response = { type: "answer", answer: answer };
    console.log(payload);
    socket.emit("sending answer", {
      ...response,
      userToPeer: payload.userToPeer,
    });

    // Store the peer connection in the array
    peersRef.current.push(peerConnection);
  };

  const handleAnswerMessage = async (message) => {
    // Set remote description
    const peerConnection = peersRef.current[0];
    await peerConnection.setRemoteDescription(message.answer);
  };

  const handleCandidateMessage = async (message) => {
    // Add the ICE candidate received from the remote peer
    console.log(peersRef)
    const peerConnection = peersRef.current[0];
    console.log(peerConnection)
    try {
      await peerConnection.addIceCandidate(message.candidate);
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  };

  useEffect(() => {

    socket.on("connect", () => {
      console.log("connected to socket server");
    });

    socket.on("disconnect", () => {
      console.log("disconnected from socket server");
    });

    socket.on("recieving offer", async (payload) => {
      console.log("received offer", payload);
      await handleOfferMessage(payload);
    });

    socket.on("recieving answer", async (payload) => {
      console.log("received answer", payload);
      await handleAnswerMessage(payload);
    });

    socket.on("recieved iceCandidate", async (payload) => {
      console.log("received ice candidate", payload);
      await handleCandidateMessage(payload);
    });

    connectToCall()
  }, []);

  const connectToCall = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    // Create a new RTCPeerConnection
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
    const peerConnection = new RTCPeerConnection(configuration);

    console.log(peerConnection, "====> local peer connection");
    // Add local stream to the peer connection
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    // Create and send an offer to the remote peer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    const payload = { type: "offer", offer: offer };
    socket.emit("sending offer", payload);

    // Setup ice candidate event
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to the remote peer via socket server
        const message = { type: "candidate", candidate: event.candidate };
        socket.emit("iceCandidate", message);
      }
    };

    // Setup remote video stream event
    peerConnection.ontrack = (event) => {
      // Display remote video stream
      
      setremoteStream(ev.streams[0]);
    };

    // store the peer connection in array[0] th index
    peersRef.current.push(peerConnection);

    // set the local stream
    setMyStream(stream);
  };

  const endCall = () => {
    setMyStream(null);
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", gap: "3rem" }}>
        {/* <button onClick={connectToCall}>call</button> */}
        <button onClick={endCall}>End call</button>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: "3rem" }}>
        <div>
          <h3>MY Stream</h3>
          {myStream && (
            <ReactPlayer
              playing
              muted
              height="300px"
              width="500px"
              url={myStream}
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
export default PeerToPeer;

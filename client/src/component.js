import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import SimplePeer from "simple-peer";

export default function PeerConnection() {
  const socketRef = useRef();
  const peerRef = useRef();
  const userVideoRef = useRef();
  const partnerVideoRef = useRef();

  // const [partnerVideoRef, setPartnerVideoRef] = useState(undefined);
  const [remoteConnections, setRemoteConnections] = useState([]);

  useEffect(() => {
    socketRef.current = io("http://localhost:4000/p2e");

    const initWebRTC = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      userVideoRef.current.srcObject = stream;

      const peer = new SimplePeer({ initiator: true, stream, trickle: false });
      console.log(peer);
      peerRef.current = peer;

      let userId;

      peer.on("signal", (data) => {
        console.log("===> signal data", data);
        socketRef.current.on("connect", () => {
          console.log("client connected to signaling server");
        });

        // sending offer to server for establish connection from other peers
        socketRef.current.emit("offer", data);
      });

      // connecting to other peers with their offer getting from server
      socketRef.current.on("iceCandidate", (iceCandidate) => {
        console.log("===> iceCandidate connection", iceCandidate);
        peer.signal(iceCandidate.offer);
      });

      // gettting stream from signaling server
      peer.on("stream", (stream) => {
        console.log("===> stream", stream);
        // setPartnerVideoRef(stream);
        // partnerVideoRef['list'] =[{'current.srcObject':stream}]
        partnerVideoRef.current.srcObject = stream;
        // setRemoteConnections((prev)=> prev.push({id:}))
      });

      socketRef.current.on("removeIceCandidate", (candidate) => {
        console.log(candidate, "===>remove iceCandidate");
      });

      peer.on("error", (error) => {
        console.log(error);
      });

      peer.on("close", () => {
        console.log("peer closed");
      });
    };
    initWebRTC();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      peerRef.current.destroy()
    };
  }, []);

  function endCall(e){
    e.preventDefault();
    partnerVideoRef.current = null
    // peerRef.current.on('close',()=>{
    // })
  }

  console.log(partnerVideoRef, "===> video stream");
  return (
    <div>
      <button onClick={endCall}> END</button>
      <video ref={userVideoRef} autoPlay muted />
      {/* {partnerVideoRef && (
        <video>
          <source ref={partnerVideoRef} type="video/mp4" />
        </video>
      )} */}
      {/* <video src={partnerVideoRef} autoPlay /> */}
      { partnerVideoRef&& <video ref={partnerVideoRef} autoPlay />}
    </div>
  );
}

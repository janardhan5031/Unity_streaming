import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import SimplePeer from "simple-peer";
import ReactPlayer from "react-player";

export default function PeerConnection() {
  const socketRef = useRef();
  const peerRef = useRef();
  const [userVideo, setUserVideo] = useState(null)
  const [partnerVideo, setPartnerVideo] = useState(null)


  // const [partnerVideoRef, setPartnerVideoRef] = useState(undefined);
  const [remoteConnections, setRemoteConnections] = useState([]);

  useEffect(() => {
    socketRef.current = io("http://localhost:4000/p2e");

    const initWebRTC = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setUserVideo(stream)

      const peer = new SimplePeer({ initiator: true, stream, trickle: false });
      console.log(peer);
      peerRef.current = peer;

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
        socketRef.current.emit('streamId',stream.id)
        setPartnerVideo(stream);
      });

      socketRef.current.on("removeIceCandidate", (streamId) => {
        console.log(streamId, "===>remove iceCandidate");
        setPartnerVideo((stream) => {
          if (stream && stream.id === streamId) {
            stream.getTracks().forEach((track) => {
              peer.removeTrack(track, stream);
            });
            return null;
          }
        });
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
      peerRef.current.destroy();
    };
  }, []);


  console.log(partnerVideo)

  return (
    <div>
      {/* <button onClick={endCall}> END</button> */}
      {userVideo && (
        <ReactPlayer playing muted url={userVideo} />
      )}
      {partnerVideo && (
        <ReactPlayer playing muted url={partnerVideo} />
      )}
    </div>
  );
}

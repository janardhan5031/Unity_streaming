import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import SimplePeer from "simple-peer";
import { io } from "socket.io-client";

const Connection = () => {
  const [mystream, setMyStream] = useState(null);
  const [remoteStreams, setremoteStreams] = useState([]);
  const [peer, setPeer] = useState(null);
  const [socket, setSocket] = useState(null);
  const [reConnect, setReConnect] = useState(false);

  const socketConnection = () => {
    const connection = io("http://localhost:4000/p2e");
    // connect to socket server
    connection.on("connect", () => {
      console.log("client connected to socket server", connection.id);
    });

    connection.on("disconnect", () => {
      console.log("client disconnected from socket server");
      setReConnect(true);
    });

    console.log(connection);
    setSocket(connection);
    return connection;
  };

  const establishPeerConnection = async (socket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      const peer = new SimplePeer({
        initiator: true,
        stream,
        trickle: false,
      });

      // console.log(peer,'====> peer conneciton =====');
      // peer.destroyed=true;
      // console.log(peer,'====> peer conneciton =====');

      peer.on("signal", (offer) => {
        socket.emit("offer", offer);
      });

      
      peer.on("stream", (stream) => {
        console.log(stream);
        console.log(peer,'sjdflkjl');
        setremoteStreams((oldStreams) => {
          console.log(oldStreams,'OLD Stream');
          return [...oldStreams,stream]
        });
      });

      peer.on("close", () => {
        console.error("Peer connection closed");
        setReConnect(true);
      });

      peer.on("end", () => {
        console.error("peer connection closed");
        setReConnect(true);
      });

      peer.on("error", (error) => {
        console.error("Peer connection error:");
        setReConnect(true);
      });

      setPeer(peer);
      setMyStream(stream);
      return peer;
    } catch (error) {
      console.log("Error accessing media devices:", error);
      setReConnect(true);
    }
  };

  useEffect(() => {
    // connect to socket server
    const connection = socketConnection();
    console.log(connection);

    let peer;
    (async () => {
      peer = await establishPeerConnection(connection);
      console.log(peer);
    })();

    return () => {
      connection.close();
      peer.destroyed = true;
    };
  }, []);

  const handleIceCandidate = (iceCandidates) => {
    console.log(iceCandidates);
    peer.signal(iceCandidates);
  };

  const handle_disconnected_candidate = (iceCandidates) => {
    console.log(iceCandidates);
    setremoteStreams([]);
    setReConnect(true);
  };

  useEffect(() => {
    if (peer) {
      socket.on("iceCandidate", handleIceCandidate);
      socket.on("candidate disconnected", handle_disconnected_candidate);

      return () => {
        socket.off("iceCandidate", handleIceCandidate);
        socket.off("candidate disconnected", handle_disconnected_candidate);
      };
    }
  }, [peer]);

  useEffect(() => {
    if (reConnect) {
      peer.destroyed = true;
      console.log("Peer connection destroyed");
      establishPeerConnection(socket)
        .then((newPeer) => {
          console.log("Peer connection re-established");
          setPeer(newPeer);
          setReConnect(false);
        })
        .catch((error) => {
          console.log("Error re-establishing peer connection:", error);
          setReConnect(false);
        });
    }
  }, [reConnect]);

  console.log(remoteStreams);
  return (
    <>
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
          {remoteStreams?.map((stream) => {
            return (
              <div key={stream.id}>
                <ReactPlayer
                  playing
                  muted
                  height="300px"
                  width="500px"
                  url={stream}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Connection;

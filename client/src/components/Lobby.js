import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import SimplePeer from "simple-peer";
import ReactPlayer from "react-player";
import {
  addNewPeer,
  destroyPeer,
  getPeerConnection,
} from "../service/wbRTCHandler";

export default function Lobby() {
  const [user, setUser] = useState({});
  const [socket, setSocket] = useState(null);
  const [rooms, setRooms] = useState([]);
  const roomInputRef = useRef("");
  const messageInputRef = useRef("");
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [currentRoom, setCurrentRoom] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);

  const newPeerConnection = async (
    socket,
    localStream,
    connUserSocketId,
    isInitiator
  ) => {
    const config = {
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    };

    console.log(localStream);
    const peer = new SimplePeer({
      initiator: isInitiator,
      config,
      stream: localStream,
    });
    peer.on("signal", (signal) => {
      console.log(signal, connUserSocketId);
      const signalData = {
        signal,
        connUserSocketId,
      };
      console.log(socket);
      socket.emit("connection_signal", signalData);
    });

    peer.on("stream", (remoteStream) => {
      console.log(remoteStream);
      remoteStream["connUserSocketId"] = connUserSocketId;
      setRemoteStreams((existingStreams) => {
        return [...existingStreams, remoteStream];
      });
    });

    return peer;
  };

  const handle_disconnected_candidate = (connUserSocketId) => {
    console.log(connUserSocketId)
    // delete the remote stream associated with connUserSocketId
    setRemoteStreams((streams) => {
      const updatedList = streams.filter((stream) => {
        return stream.connUserSocketId !== connUserSocketId;
      });
      return [...updatedList];
    });

    // destroy the peer connection associated with connUserSocketId and
    // remove that peer from peers list
    const peer = getPeerConnection(connUserSocketId);
    console.log(peer);
    peer.destroyed = true;
    const res = destroyPeer(connUserSocketId);
    console.log(res ? "successfully removed peer" : "failed to remove peer");
  };

  const connectServer = useCallback(async (localStream) => {
    const connection = io("http://localhost:4000/p2e");

    connection.on("connect", () => {
      console.log("user connected ", connection?.id);
      setUser((oldData) => {
        return { ...oldData, userSocketId: connection.id };
      });
      setSocket(connection);
    });

    // getting all active rooms
    connection.on("get active rooms", (payload) => {
      console.log(payload, "rooms list");
      setRooms(payload.rooms);
    });

    connection.on(
      "recieve message from room",
      ({ message, roomId, userName }) => {
        console.log(message + "<=== from " + userName);
      }
    );

    connection.on("joined the room", ({ userId, roomId }) => {
      console.log(userId + " <=== joined the room " + roomId);
    });

    connection.on(
      "create_peer_at_participant_side",
      async ({ connUserSocketId }) => {
        console.log("create_peer_at_participant_side");
        newPeerConnection(connection, localStream, connUserSocketId, false)
          .then((peer) => {
            console.log(peer);
            const res = addNewPeer(connUserSocketId, peer);
            console.log(res ? "successfully added peer" : "failed to add peer");
            connection.emit("create_peer_at_newUser_side", connUserSocketId);
          })
          .catch((error) => {
            console.error("Error creating peer connection:", error);
          });
      }
    );

    connection.on("create_peer_at_newUser_side", async (connUserSocketId) => {
      newPeerConnection(connection, localStream, connUserSocketId, true)
        .then((peer) => {
          console.log(peer);
          const res = addNewPeer(connUserSocketId, peer);
          console.log(res ? "successfully added peer" : "failed to add peer");
          console.log("create_peer_at_newUser_side");
        })
        .catch((error) => {
          console.log("unable to create peer_at_newUser_side");
        });
    });

    connection.on("peer_signal", ({ signal, connUserSocketId }) => {
      console.log(signal, connUserSocketId);
      const peer = getPeerConnection(connUserSocketId);
      console.log(peer);
      if (peer) {
        peer.signal(signal);
      }
    });

    connection.on("exited from the room", ({ userId, roomId }) => {
      console.log(userId + " <=== exited the room " + roomId);
      handle_disconnected_candidate(userId)
    });

    connection.on("participant_disconnected", ({ connUserSocketId }) => {
      console.log(connUserSocketId + " disconnected");
      handle_disconnected_candidate(connUserSocketId)
    });
  }, []);

  const getLocalStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    return stream;
  }, []);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("userData"));
    setUser(data);

    (async () => {
      try {
        const stream = await getLocalStream();

        const socket = await connectServer(stream);

        setLocalStream(stream);
        setSocket(socket);
      } catch (error) {
        console.error(error);
      }
    })();

    // get the local Stream
  }, []);

  const createRoom = () => {
    const roomName = roomInputRef.current.value;
    console.log(roomName);
    if (!roomName) window.alert("Please enter roome name");
    else {
      roomInputRef.current.value = "";
      socket.emit("create room", {
        name: user.name,
        hostSocketId: user.userSocketId,
        roomName: roomName,
        isHost: true,
      });
    }
  };

  const joinRoomHandler = (roomId, roomName) => {
    // const roomId = e.target.id;
    // const roomName = rooms.find((r) => r.roomId === roomId);
    console.log(roomName);
    socket.emit("join to room", roomId);

    setActiveRoomId(roomId);
    setCurrentRoom({ roomId, roomName, isActive: true });
  };

  const exitRoomHandler = () => {
    socket.emit("exit from the room", currentRoom.roomId);
    setCurrentRoom({});
  };

  const sendMessageHandler = () => {
    const message = messageInputRef.current.value;
    socket.emit("send message", {
      message,
      roomId: activeRoomId,
      userName: user.name,
    });
    messageInputRef.current.value = "";
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", gap: "3rem" }}>
        {user?.name && <h3>{user.name}</h3>}
        <div>
          <br />
          <input type="text" ref={roomInputRef} />
          <button onClick={createRoom}>create Room</button>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h3>Active rooms</h3>
          {rooms?.length > 0 &&
            rooms.map((room, idx) => {
              return (
                <button
                  id={room.roomId}
                  key={room.roomId}
                  onClick={() => joinRoomHandler(room.roomId, room.roomName)}
                >
                  join {room.roomName}
                </button>
              );
            })}
        </div>
        <div>
          {currentRoom?.isActive && (
            <div>
              <button onClick={exitRoomHandler}>
                Exit {currentRoom.roomName}
              </button>
              <input type="text" ref={messageInputRef} />
              <button onClick={sendMessageHandler}>send</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex" }}>
        {localStream && (
          <ReactPlayer
            playing
            muted
            height="100px"
            width="200px"
            url={localStream}
          />
        )}
        {remoteStreams.length > 0 &&
          remoteStreams.map((remoteStream) => {
            return (
              <div key={remoteStream.connUserSocketId}>
                <ReactPlayer
                  playing
                  muted
                  height="100px"
                  width="200px"
                  url={remoteStream}
                />
              </div>
            );
          })}
      </div>
    </>
  );
}

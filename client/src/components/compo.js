import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001'); // Replace with your socket server URL

const App = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef([]);
  const peerConnectionsRef = useRef([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to the socket server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from the socket server');
      setIsConnected(false);
    });

    socket.on('message', async (message) => {
      if (message.type === 'offer') {
        // Handle incoming offer message
        await handleOfferMessage(message);
      } else if (message.type === 'answer') {
        // Handle incoming answer message
        await handleAnswerMessage(message);
      } else if (message.type === 'candidate') {
        // Handle incoming ICE candidate message
        await handleCandidateMessage(message);
      }
    });

    // Cleanup function
    return () => {
      socket.disconnect();
    };
  }, []);

  const startVideoChat = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    // Display local video stream
    localVideoRef.current.srcObject = stream;

    // Create a new RTCPeerConnection
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const peerConnection = new RTCPeerConnection(configuration);

    // Add local stream to the peer connection
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    // Setup ice candidate event
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to the remote peer via socket server
        const message = { type: 'candidate', candidate: event.candidate };
        socket.emit('message', message);
      }
    };

    // Setup remote video stream event
    peerConnection.ontrack = (event) => {
      // Display remote video stream
      const remoteVideoRef = createRemoteVideoRef();
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    // Create and send an offer to the remote peer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    const message = { type: 'offer', offer: offer };
    socket.emit('message', message);

    // Store the peer connection in the array
    peerConnectionsRef.current.push(peerConnection);
  };

  const handleOfferMessage = async (message) => {
    // Set remote description
    const peerConnection = createPeerConnection();
    await peerConnection.setRemoteDescription(message.offer);

    // Create and send an answer to the remote peer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    const response = { type: 'answer', answer: answer };
    socket.emit('message', response);

    // Store the peer connection in the array
    peerConnectionsRef.current.push(peerConnection);
  };

  const handleAnswerMessage = async (message) => {
    // Set remote description
    const peerConnection = peerConnectionsRef.current[0];
    await peerConnection.setRemoteDescription(message.answer);
  };

  const handleCandidateMessage = async (message) => {
    // Add the ICE candidate received from the remote peer
    const peerConnection = peerConnectionsRef.current[0];
    try {
      await peerConnection.addIceCandidate(message.candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  const createRemoteVideoRef = () => {
    const ref = useRef(null);
    remoteVideoRefs.current.push(ref);
    return ref;
  };

  const createPeerConnection = () => {
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const peerConnection = new RTCPeerConnection(configuration);

    // Setup remote video stream event
    peerConnection.ontrack = (event) => {
      // Display remote video stream
      const remoteVideoRef = createRemoteVideoRef();
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    return peerConnection;
  };

  const handleDisconnect = () => {
    // Close all peer connections
    peerConnectionsRef.current.forEach((peerConnection) => {
      peerConnection.close();
    });

    // Clear the arrays
    remoteVideoRefs.current = [];
    peerConnectionsRef.current = [];
  };

  return (
    <div>
      <h1>Video Conference</h1>
      {!isConnected ? (
        <p>Connecting to the server...</p>
      ) : (
        <>
          <video ref={localVideoRef} autoPlay muted playsInline />
          {remoteVideoRefs.current.map((ref, index) => (
            <video key={index} ref={ref} autoPlay playsInline />
          ))}
          <button onClick={startVideoChat}>Start Video Chat</button>
          <button onClick={handleDisconnect}>Disconnect</button>
        </>
      )}
    </div>
  );
};

export default App;

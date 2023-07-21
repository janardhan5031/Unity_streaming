let peers ={};

export const addNewPeer =(connUserSocketId, peer)=>{
  peers[connUserSocketId] = peer
  return true;
}

export const getPeerConnection =(connUserSocketId)=>{
  const peer = peers[connUserSocketId];
  return peer;
}

export const destroyPeer =(connUserSocketId)=>{
  const peer = peers[connUserSocketId];
  console.log(peer)
  return peer ? true: false;
}
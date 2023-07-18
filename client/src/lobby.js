import { useState } from "react";
import AdminComponent from "./components/admin";
import Participant from "./components/participant";

const Lobby = () => {
  const [isAdmin, setisAdmin] = useState(null);

  const adminHandler = (e) => {
    setisAdmin(true);
  };

  const participantHandler = (e) => {
    setisAdmin(false);
  };

  return (
    <>
      {isAdmin === null && (
        <div style={{ display: "flex", gap: "5rem", justifyContent: "center" }}>
          <button onClick={adminHandler}>Join as Admin </button>
          <button onClick={participantHandler}>Join as Prticipant </button>
        </div>
      )}

      {isAdmin && <AdminComponent />}
      {isAdmin === false && <Participant />}
    </>
  );
};

export default Lobby;

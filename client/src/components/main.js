import { useState } from "react";
import Login from "./Login";
import Lobby from "./Lobby";

const Main =()=>{
    const [isLoggin, setIsLoggin] = useState(false)
    function handleLoginState(){
        setIsLoggin(true)
    }
    return <>
        {!isLoggin && <Login setLogin={handleLoginState} />}
        {isLoggin && <Lobby />}
    </>
}
export default Main;
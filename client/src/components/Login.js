import { useRef } from "react";

const Login = (props) => {
  const loginRef = useRef("");
  const loginHandler = () => {
    console.log(loginRef.current.value , 'user logged in successfully');
    localStorage.setItem(
      "userData",
      JSON.stringify({ name: loginRef.current.value })
    );
    props.setLogin();
  };
  return (
    <>
      <div>
        <br />
        <input type="text" ref={loginRef} />
        <button onClick={loginHandler}>Login</button>
      </div>
    </>
  );
};

export default Login;

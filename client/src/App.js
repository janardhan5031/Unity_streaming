import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import PeerConnection from './components/admin';
import Connection from './components/Connection';
import Lobby from './lobby';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <br/>
        {/* <PeerConnection /> */}
        <Lobby/>
      </div>
    );
  }
}

export default App;

import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import PeerConnection from './component';
import Connection from './components/Connection';
import Login from './components/Login';
import Main from './components/main';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Main />
      </div>
    );
  }
}

export default App;

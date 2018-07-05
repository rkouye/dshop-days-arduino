import React, { Component } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "./logo.svg";
import * as RS from 'reactstrap';
import { Stage, Layer, Rect, Text } from 'react-konva';
import Konva from 'konva';
import "./App.css";

class App extends Component {
  constructor(p) {
    super(p);
    this.state = {
      connection: null,
      connectionError : null,
      ws : null
    };
  }

  connect = () => {
    let connection = new WebSocket("ws://127.0.0.1:1337");

    this.setState({connectionError : null});

    connection.onopen = () => {
      this.setState({connection});
    };
    connection.onerror = (error)=>{
      this.setState({connectionError : error});
    };
    connection.onclose = ()=>{
      this.setState({connection : null});
    };

    connection.onmessage = (message)=>{
      const payload = JSON.parse(message.data);
      this.setState({ws : payload});
    };
  }
  render() {
    const map = (this.state.ws || {}).static;
    const car = (this.state.ws || {}).car;
    const dynamic = (this.state.ws || {}).dynamic;
    
    const factor = 0.75;
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">mobi swarm</h1>
        </header>
        <div className="App-intro">
          <RS.Fade in={!!this.state.connectionError} mountOnEnter unmountOnExit>
            <RS.Alert color="danger">Connection error</RS.Alert>
          </RS.Fade>
          <RS.Fade in={!this.state.connection} mountOnEnter unmountOnExit>
            <RS.Alert color="danger">Not connected to WebSocket</RS.Alert>
            <RS.Button color="primary" onClick={this.connect}>Connect</RS.Button>
          </RS.Fade>

          <RS.Fade in={!!this.state.connection} mountOnEnter unmountOnExit>
            <RS.Alert color="success">Connected to WebSocket</RS.Alert>
          </RS.Fade>

          { !!map && <RS.Fade in={!!map} mountOnEnter unmountOnExit>
          <Stage width={map.playground.width*factor} height={map.playground.height*factor}>
            <Layer >
            <Rect width={map.playground.width*factor} height={map.playground.height*factor} x={0} y={0} fill="#000"/>
              {
                Object.keys(map.road.vertices).map( point => 
                <React.Fragment  key={point}>
                <Rect width={10*factor} height={10*factor} x={map.road.vertices[point].x*factor} y={map.road.vertices[point].y*factor} fill="yellow"/>
                <Text text={point} x={(map.road.vertices[point].x+10) * factor} y={ (map.road.vertices[point].y+10)*factor} fill="red"/>
                </React.Fragment>)
              }

              { !!car &&
                <React.Fragment>
                  <Rect width={20*factor} height={20*factor} x={car.front.x*factor} y={car.front.y*factor} fill="white"/>
                  <Rect width={20*factor} height={20*factor} x={car.center.x*factor} y={car.center.y*factor} fill="pink"/>
                  <Rect width={20*factor} height={20*factor} x={car.back.x*factor} y={car.back.y*factor} fill="red"/>
                </React.Fragment>
              }
            
            </Layer>
          </Stage>
          </RS.Fade>}

           <RS.Button  color="info" onClick={() =>{
             this.state.connection.send(JSON.stringify({
               type : "set_intent",
               intent : {
                 type : "GO_TO_POINT",
                 point : "p44"
               }
             }));
           }}>Go to P1</RS.Button>

           <RS.Button color="danger" onClick={() =>{
             this.state.connection.send(JSON.stringify({
               type : "set_intent",
               intent : {}
             }));
           }}>Stop</RS.Button>
        </div>
      </div>
    );
  }
}

export default App;

/*
<button
            onClick={() => {
              connection.send(
                `M${String.fromCharCode(120)}${String.fromCharCode(60)}`
              );
            }}
          >
            Forward
          </button>

          <br />
          <button
            onClick={() => {
              connection.send(
                `M${String.fromCharCode(180)}${String.fromCharCode(0)}`
              );
            }}
          >
            Clockwise
          </button>
          <button
            onClick={() => {
              connection.send("MUZ");
            }}
          >
            Stop
          </button>
          <button
            onClick={() => {
              connection.send(
                `M${String.fromCharCode(70)}${String.fromCharCode(70)}`
              );
            }}
          >
            Counter Clockwise
          </button>
*/
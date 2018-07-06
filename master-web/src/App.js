import React, { Component } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import * as RS from 'reactstrap';
import { Stage, Layer, Rect, Text, Circle, Arrow } from 'react-konva';
import "./App.css";

class App extends Component {
  constructor(p) {
    super(p);
    this.state = {
      connection: null,
      connectionError : null,
      ws : null,
      displayPointName : false,
      selectedPoint : ""
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
    const road = (this.state.ws || {}).road;
    const target = (this.state.ws || {}).target;
    const nextTarget = (this.state.ws || {}).nextTarget;

    const factor = 0.75;
    return (
      <div className="App">
        <header className="App-header">
        <div className="sk-cube-grid">
          <div className="sk-cube sk-cube1"></div>
          <div className="sk-cube sk-cube2"></div>
          <div className="sk-cube sk-cube3"></div>
          <div className="sk-cube sk-cube4"></div>
          <div className="sk-cube sk-cube5"></div>
          <div className="sk-cube sk-cube6"></div>
          <div className="sk-cube sk-cube7"></div>
          <div className="sk-cube sk-cube8"></div>
          <div className="sk-cube sk-cube9"></div>
        </div>
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
          <RS.Container>
            <RS.Row>
              <RS.Col sm={9}>
              { !!map && <RS.Fade in={!!map} mountOnEnter unmountOnExit>
              <Stage width={map.playground.width*factor} height={map.playground.height*factor}>
                <Layer >
                <Rect width={map.playground.width*factor} height={map.playground.height*factor} x={0} y={0} fill="#000"/>
                  {
                    Object.keys(map.road.vertices).map( point => 
                    <React.Fragment  key={point}>
                    <Rect width={10*factor} height={10*factor} x={map.road.vertices[point].x*factor} y={map.road.vertices[point].y*factor} fill="yellow"
                    onClick={()=>{
                      this.setState({selectedPoint : point})
                    }}/>
                    { this.state.displayPointName &&
                    <Text text={point} x={(map.road.vertices[point].x+10) * factor} y={ (map.road.vertices[point].y+10)*factor} fill="red"/>}
                    </React.Fragment>)
                  }

                  { !!road &&
                    road.map( 
                      point => <Rect width={10*factor} height={10*factor} x={map.road.vertices[point].x*factor} y={map.road.vertices[point].y*factor} fill="cyan"
                      key={point}/>)
                  }
                  {
                    !!nextTarget && !!car &&
                    <Arrow points={[ (car.front.x+10)*factor, (car.front.y+10)*factor, (map.road.vertices[nextTarget].x+5)*factor, (map.road.vertices[nextTarget].y+5)*factor ]}
                    fill="violet" stroke="violet" />
                  }
                  { !!car &&
                    <React.Fragment>
                      <Rect width={20*factor} height={20*factor} x={car.front.x*factor} y={car.front.y*factor} fill="white"/>
                      <Rect width={20*factor} height={20*factor} x={car.center.x*factor} y={car.center.y*factor} fill="pink"/>
                      <Rect width={20*factor} height={20*factor} x={car.back.x*factor} y={car.back.y*factor} fill="red"/>
                      <Circle radius={60*factor} stroke="white" x={car.front.x*factor} y={car.front.y*factor} />
                      <Arrow points={[ (car.back.x+10)*factor, (car.back.y+10)*factor,(car.front.x+10)*factor, (car.front.y+10)*factor ]} fill="red" stroke="red" />
                    </React.Fragment>
                  }
                </Layer>
              </Stage>
              </RS.Fade>}
              </RS.Col>
              <RS.Col sm={3} className="border-left">
                  Elie's planning
              </RS.Col>
            </RS.Row>

            <RS.Row>
              <RS.Col>
                <RS.Card body className="my-3">
                  <RS.CardTitle>Autonomous mode</RS.CardTitle>
                  <RS.InputGroup className="m-3">
                    <RS.InputGroupAddon addonType="prepend">
                      <RS.Button color="info" onClick={() =>{
                      this.state.connection.send(JSON.stringify({
                        type : "set_intent",
                        intent : {
                          type : "GO_TO_POINT",
                          point : this.state.selectedPoint
                        }
                      }));
                    }}>Go to point</RS.Button> 
                    </RS.InputGroupAddon>
                  <RS.Input value={this.state.selectedPoint} onChange={ event => this.setState({selectedPoint : event.target.value})}/>
                  </RS.InputGroup>
                  
                  <RS.Button className="m-3" color="danger" onClick={() =>{
                      this.state.connection.send(JSON.stringify({
                        type : "set_intent",
                        intent : {}
                      }));
                    }}>Stop</RS.Button>
                  <RS.Button className="m-3" color="secondary" onClick={() =>{
                      this.setState({ displayPointName : !this.state.displayPointName });
                  }}>Toggle Text</RS.Button>
                </RS.Card>
              </RS.Col>

              <RS.Col>
              <RS.Card body className="my-3">
                  <RS.CardTitle>Manual Mode</RS.CardTitle>
                  
                  
                  <RS.Button className="m-3" color="primary" onClick={() =>{
                    this.state.connection.send(JSON.stringify({
                      type : "proxy_mqtt",
                      command : `M${String.fromCharCode(108)}${String.fromCharCode(0)}`
                    }));
                    }}>Forward</RS.Button>
                    



                    <RS.ButtonGroup className="m-auto">
                      <RS.Button color="warning" onClick={() =>{
                         this.state.connection.send(JSON.stringify({
                          type : "proxy_mqtt",
                          command : `M${String.fromCharCode(85)}${String.fromCharCode(70)}`
                        }));
                    }}>
                      Counter-Clockwise
                      </RS.Button>
                    
                    
                      <RS.Button color="warning" onClick={() =>{
                        this.state.connection.send(JSON.stringify({
                          type : "proxy_mqtt",
                          command : `M${String.fromCharCode(100)}${String.fromCharCode(90)}`
                        }));
                      }}>
                        Clockwise
                      </RS.Button>
                    
                    </RS.ButtonGroup>
                  
                  <RS.Button className="m-3" color="danger" onClick={() =>{
                     this.state.connection.send(JSON.stringify({
                      type : "proxy_mqtt",
                      command : `M${String.fromCharCode(85)}${String.fromCharCode(90)}`
                    }));
                  }}>Brake</RS.Button>
                </RS.Card>
              </RS.Col>
            </RS.Row>
          </RS.Container>
            
          </RS.Fade>
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
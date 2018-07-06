var mqtt = require("mqtt");
var WebSocketServer = require("websocket").server;
var http = require("http");
var dijkstra = require('dijkstrajs');
var jsmath = require('js-2dmath');

const Vec = jsmath.Vec2;

var fakestatic = require("./fakestatic");

const TOPIC_DS_STATIC = "dshop/paris/autonomy/detection-service/0/out/static";
const TOPIC_DS_DYNAMIC = "dshop/paris/autonomy/detection-service/0/out/dynamic";

let intent = {};

function intentFulfiller(){
  console.log("Intent fullfiller process...");
  switch(intent.type){
    case 'GO_TO_POINT' :
    goToPoint(intent.point)
    break;
    default :
    console.log("No intent");
    payload.road = null;
    payload.target = null;
    payload.nextTarget = null;
  }
}

const ROAD_RANGE = 60;

function getPoint(name){
  return  payload.static.road.vertices[name];
}
function distance(p1, p2){
  return Math.sqrt( Math.pow(p1.x - p2.x, 2) + (Math.pow(p1.y - p2.y, 2)));
}

function goToPoint(point){

  payload.target = point;
  console.log("Going to point "+point);


  if(!payload.car.valid) {
    console.warn("Can't see car, won't do anything");
    return;
  }
  let closest = sortedDistanceToPointOnRoad(payload.car.front)[0];
  if(closest.point === point){
    console.log("Closest point is already "+point);
  } else {
    console.log("Closest point is "+closest.point);
    payload.road = dijkstra.find_path(payload.staticGraph, closest.point, point);
    let i = 0;
    while( distance(payload.car.front, getPoint(payload.road[i])) < ROAD_RANGE && closest.point !== point){
      i++;
    }
    point = payload.road[i];
  }
  
  console.log("Target : "+point);
  payload.nextTarget = point;

  const pointX = getPoint(point).x;
  const pointY = getPoint(point).y;
  const carVectX = payload.car.front.x - payload.car.back.x;
  const carVectY = payload.car.front.y - payload.car.back.y;
  
  const dirVectX = pointX - payload.car.center.x;
  const dirVectY = pointY -payload.car.center.y
  const carVect = Vec.create( carVectX , carVectY);
  
  const dirVect = Vec.create( dirVectX , dirVectY );

  let a1= carVectX;
  let b1= carVectY;
  let a2= dirVectX;
  let b2= dirVectY;
  let coss=(a1*a2+b1*b2)/(Math.sqrt(a1*a1+b1*b1)*Math.sqrt(a2*a2+b2*b2));
  let angle = Math.round(Math.acos(coss)*180/3.1415*100)/100
  const rad = Vec.toAngle(carVect, dirVect);
  
  const distFrontToPoint =  Math.sqrt( Math.pow(payload.car.front.x - pointX, 2) + (Math.pow(payload.car.front.y - pointY, 2)));
  
  if(angle > 20) {
    console.log("Correcting angle "+angle);
    if(rad>0){
      turnCounterClockwise();
    } else {
      turnClockwise();
    }
  } else if(distFrontToPoint > ROAD_RANGE){
    console.log("Moving forward");
    forward();
  } else {
    stop();
    console.log("On point")
  }
}

let latestClient;

let payload = {
  static : null,//fakestatic,
  staticGraph : null, //graphFromStatic(fakestatic),
  dynamic : null,
  car : null,
  target : null,
  nextTarget : null,
  road : null
}

function graphFromStatic(static){
  const graph = {};
  Object.keys(static.road.edges).forEach( point => {
    var edges = static.road.edges[point];
    graph[point] = {};
    edges.forEach( edge => {
      graph[point][edge] = 1;
    });
  });
  return graph;
}

function carInfoFromDynamic(dynamic){
  let valid = true;
  const front = {};
  if(dynamic && dynamic.vehicules){
    dynamic.vehicules.forEach(
      vehicule => {
        if(vehicule.class_value === 3) {
          front.x = vehicule.coordinates.x;
          front.y = vehicule.coordinates.y;
        }
      }
    );
  }

  const back = {};
  if(dynamic && dynamic.custom){
    dynamic.custom.forEach(
      dot => {
        if(dot.class_value === 2){
          back.x = dot.coordinates.x;
          back.y = dot.coordinates.y;
        }
      }
    )
  }

  valid = front.x && front.y && back.x && back.y;

  return { front, back, center : { x : (front.x+back.x)/2 , y : (front.y+back.y)/2 }, valid }
}
console.log("Server started, connecting to MQTT Broker");

var client = mqtt.connect("mqtt://sapaaca.fr");

function publish(command){
  console.log(`Publishing command ${command}`);
  client.publish("dshop/team3/0/slave", command);
}
function stop(){
  publish("MUZ");
}
function turnClockwise(){
  publish(`M${String.fromCharCode(100)}${String.fromCharCode(90)}`);
}
function turnCounterClockwise(){
  publish(`M${String.fromCharCode(85)}${String.fromCharCode(70)}`);
}
function forward(){
  publish(`M${String.fromCharCode(108)}${String.fromCharCode(0)}`);
}
function startSocket() {

  var server = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets
    // server we don't have to implement anything.
  });

  server.listen(1337, function() {});

  var wsServer = new WebSocketServer({
    httpServer: server
  });

  // WebSocket server
  wsServer.on("request", function(request) {
    var connection = request.accept(null, request.origin);
    
    console.log("Client connected");
    
    if(latestClient) {
      console.warn("Closing previous client, only one allowed");
      latestClient.close()
    }

    latestClient = connection;
    
    sendInfo(latestClient);

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on("message", function(message) {
      if (message.type === "utf8") {
        // process WebSocket message
        console.log("ved command from websocket client");
        const payload = JSON.parse(message.utf8Data);
        switch(payload.type){
          case "proxy_mqtt" :
            publish(payload.command);
          break;
          case "set_intent" :
          intent = payload.intent;
          break;
        }
      
      }
    });

    connection.on("close", function(connection) {
      // close user connection
      console.log("Client disconnected");
      if(latestClient === connection) latestClient = undefined;
    });
  });
}

client.on("connect", function() {

  console.log("Starting websocket...");
  startSocket();
  console.log("Websocket Ready");

  console.log("Connected to MQTT");
  console.log("Subscribe to topics");
  
  client.subscribe([
    TOPIC_DS_STATIC,
    TOPIC_DS_DYNAMIC
  ], function(err){
    if(err) console.error("Subscription failed, abort mission !");
    else console.log("Subscription done, go get them !")
  });

});

client.on("message", function(topic, message, packet){
  console.log(`Message ved on topic ${topic}`);
  switch(topic){
    case TOPIC_DS_STATIC :
    payload.static = JSON.parse(message);
    payload.staticGraph = graphFromStatic(payload.static);
    break;
    case TOPIC_DS_DYNAMIC :
    payload.dynamic = JSON.parse(message);
    payload.car = carInfoFromDynamic(payload.dynamic);
    //payload.car = { front : getPoint("p104"),back : getPoint("p86"), center : getPoint("p100"), valid : true }
    intentFulfiller();
    break;
  }
  // Proxy message to latest client
  if(latestClient) sendInfo(latestClient)
});


function sortedDistanceToPointOnRoad({x,y}){
  let vertices = payload.static.road.vertices;
  
  const distance = [];

  Object.keys(vertices).forEach( point => distance.push({ 
    point , 
    distance :  Math.sqrt( Math.pow(x - vertices[point].x, 2) + (Math.pow(y - vertices[point].y, 2)) )
  }));

  return distance.sort( (a,b) => a.distance - b.distance);
}

function sendInfo(connection){

  if(!payload.static || !payload.staticGraph) {
    console.warn("Missing static elements information");
    return;
  }
  
  //console.log(dijkstra.find_path(payload.staticGraph, "p1", "p3"));
  //console.log(sortedDistanceToPointOnRoad({x : 0, y : 0}));
  connection.send(JSON.stringify(payload));

}
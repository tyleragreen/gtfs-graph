/* 

   Author: Tyler A. Green (greent@tyleragreen.com)
*/
var http = require('http');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var socketio = require('socket.io');
var createGraph = require('./lib/createGraph.js');
var pg = require('pg');

var router = express();

var server = http.createServer(router);
var io = socketio.listen(server);

router.use(bodyParser.json()); // for parsing application/json
router.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Initialize a list of connections to this server
var graph;
var stops;
var connectionString = 'postgres://thebusrider:3ll3board!@mta-gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/mta_gtfs';

// Set up Express to fetch the client from a subdirectory
router.use(express.static(path.resolve(__dirname, 'public')));

// Start the http server
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
  var addr = server.address();
  console.log("Server listening at", addr.address + ":" + addr.port);
  
  console.log("Initializing graph");
  createGraph(function(new_stops, new_graph) {
    stops = new_stops;
    graph = new_graph;
  });
});

// Save incoming connections and fetch the initial data
io.on('connection', function (socket) {
  socket.emit('new edge', 'Hello World!');
  
  socket.on('send stops', function() {
    socket.emit('stops', stops);
  });
  
  socket.on('start dfs', function(data) {
    console.log(data);
    setInterval(function() {
      socket.emit('new edge', graph);
    }, 1000);
  });
});
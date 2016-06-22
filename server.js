/* 

   Author: Tyler A. Green (greent@tyleragreen.com)
*/
var http = require('http');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var socketio = require('socket.io');
//var Graph = require('./lib/graph.js');
var createGraph = require('./lib/createGraph.js');
var pg = require('pg');

var router = express();

var server = http.createServer(router);
var io = socketio.listen(server);

router.use(bodyParser.json()); // for parsing application/json
router.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Initialize a list of connections to this server
var sockets = [];
var connectionString = 'postgres://thebusrider:3ll3board!@mta-gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/mta_gtfs';

// Set up Express to fetch the client from a subdirectory
router.use(express.static(path.resolve(__dirname, 'public')));

// Start the http server
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
  var addr = server.address();
  console.log("Server listening at", addr.address + ":" + addr.port);
});

//      sockets.forEach(function(socket) {
//        socket.emit('update', data);
      //});

// Save incoming connections and fetch the initial data
io.on('connection', function (socket) {
  sockets.push(socket);
  socket.emit('new edge', 'Hello World!');
  
  socket.on('start dfs', function(data) {
    console.log(data);
  });
});
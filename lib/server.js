var http = require('http');
var path = require('path');
var express = require('express');
var socketio = require('socket.io');
var socketMsg = require('../public/js/constants.js');
var EventQueue = require('./eventQueue.js');

var router = express();

// Set up Express to fetch the client from a subdirectory
router.use(express.static(path.resolve(__dirname, '../public')));

this.server = http.createServer(router);

exports.listen = function() {
  var io = socketio.listen(this.server);
  console.log("Starting server");
  
  this.server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
    var addr = this.address();
    console.log("Server listening at", addr.address + ":" + addr.port);
    //console.log("Server listening");
  });

  io.on('connection', function (socket) {
    socket.emit(socketMsg.log, 'Connected to the server!');
    eventQueue = new EventQueue(50, function (queue) {
      socket.emit(socketMsg.event, queue.shift());
    });
    
    socket.on(socketMsg.requestStops, function() {
      socket.emit(socketMsg.sendStops, stops_geojson);
    });
    
    socket.on(socketMsg.requestEdges, function() {
      socket.emit(socketMsg.sendEdges, graph.edgesAsGeoJson(stops));
    });
    
    socket.on('error', function(err) {
      throw err;
    });
    
    socket.on(socketMsg.startDfs, function(data) {
      console.log(socketMsg.startDfs);
      graph.dfs(0);
    });
  });
};

exports.close = function() {
  this.server.close();  
};
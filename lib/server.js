'use strict';

var http = require('http');
var path = require('path');
var express = require('express');
var socketio = require('socket.io');
var socketMsg = require('../public/js/constants.js');
var traversals = require('./traversals.js');
var SocketTraverser = require('./graphTraverser.js').SocketTraverser;
var logger = require('./logger.js');

var router = express();

// Set up Express to fetch the client from a subdirectory
router.use(express.static(path.resolve(__dirname, '../public')));

this.server = http.createServer(router);

exports.listen = function(graph, mergedGraph) {
  var io = socketio.listen(this.server);
  logger.info("Starting server");
  
  this.server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
    var addr = this.address();
    logger.info("Server listening at", addr.address + ":" + addr.port);
  });

  io.on('connection', function (socket) {
    socket.emit(socketMsg.log, 'Connected to the server!');
    
    // Create a traverser that is specific to this socket connection
    var graphTraverser = new SocketTraverser(graph, socket);
    
    socket.on(socketMsg.requestStops, function() {
      socket.emit(socketMsg.sendStops, graph.stopsAsGeoJson());
    });
    
    socket.on(socketMsg.requestEdges, function() {
      socket.emit(socketMsg.sendEdges, graph.edgesAsGeoJsonFeatures());
    });
    
    socket.on('error', function(err) {
      throw err;
    });
    
    socket.on(socketMsg.startDfs, function(startingNode) {
      logger.info(socketMsg.startDfs);
      graphTraverser.reset();
      let startingIndex = graph.stops.indexOf(startingNode);

      traversals.dfs(graph,graphTraverser,startingIndex);
    });
    
    socket.on(socketMsg.startBfs, function(startingNode) {
      logger.info(socketMsg.startBfs);
      graphTraverser.reset();
      traversals.bfs(graph,graphTraverser,startingNode);
    });
    
    var thatSocket = socket;
    
    socket.on(socketMsg.startPR, function(data) {
      logger.info(socketMsg.startPR);
      traversals.pageRank(mergedGraph,thatSocket);
    });
  });
};

exports.close = function() {
  this.server.close();  
};

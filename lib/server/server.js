'use strict';

var http = require('http');
var path = require('path');
var express = require('express');
var socketio = require('socket.io');
var socketMsg = require('../constants.js');
var traversals = require('./traversals.js');
var SocketTraverser = require('./graphTraverser.js').SocketTraverser;
var logger = require('./logger.js');

var router = express();

// Set up Express to fetch the client from a subdirectory
router.use('/',express.static(path.resolve(__dirname, '../../public/home')));
router.use('/bundle',express.static(path.resolve(__dirname, '../../public/bundle')));
router.use('/demo',express.static(path.resolve(__dirname, '../../public/demo')));
router.use('/page-rank',express.static(path.resolve(__dirname, '../../public/page-rank')));
router.use('/files',express.static(path.resolve(__dirname, '../../public/files')));

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
      socket.emit(socketMsg.sendStops, graph.stops);
      socket.emit(socketMsg.sendMergedStops, mergedGraph.stops);
    });
    
    socket.on(socketMsg.requestEdges, function() {
      socket.emit(socketMsg.sendEdges, graph.edgesAsGeoJsonFeatures());
    });
    
    socket.on(socketMsg.requestMergedEdges, function() {
      socket.emit(socketMsg.sendMergedEdges, mergedGraph.edgesAsGeoJsonFeatures());
    });
    
    socket.on('error', function(err) {
      throw err;
    });
    
    socket.on(socketMsg.clearQueue, function() {
      graphTraverser.reset();
    });
    
    socket.on(socketMsg.startDfs, function(stopId) {
      graphTraverser.reset();
      logger.info(socketMsg.startDfs);

      traversals.dfs(graph,graph.getStopIndex(stopId),graphTraverser);
    });
    
    socket.on(socketMsg.startBfs, function(stopId) {
      graphTraverser.reset();
      logger.info(socketMsg.startBfs);
      
      traversals.bfs(graph,graph.getStopIndex(stopId),graphTraverser);
    });
    
    socket.on(socketMsg.startDijkstra, function(originId, destinationId) {
      graphTraverser.reset();
      logger.info(socketMsg.startDijkstra);
      
      traversals.dijkstra(graph, graph.getStopIndex(originId), graph.getStopIndex(destinationId), graphTraverser);
    });
    
    socket.on(socketMsg.startPR, function(data) {
      graphTraverser.reset();
      logger.info(socketMsg.startPR);
      
      traversals.pageRank(mergedGraph,graphTraverser);
    });
  });
};

exports.close = function() {
  this.server.close();  
};

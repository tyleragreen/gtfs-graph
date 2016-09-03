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

exports.listen = function(graphs, SystemManager) {
  var io = socketio.listen(this.server);
  logger.info("Starting server");
  
  this.server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
    var addr = this.address();
    logger.info("Server listening at", addr.address + ":" + addr.port);
  });

  io.on('connection', function (socket) {
    socket.emit(socketMsg.log, 'Connected to the server!');
    
    socket.on(socketMsg.requestSystem, function(systemId) {
      socket.emit(socketMsg.sendSystem, SystemManager.get(systemId));
    });
    // Create a traverser that is specific to this socket connection
    var graphTraverser = new SocketTraverser(socket);
    
    socket.on(socketMsg.requestStops, function(system) {
      socket.emit(socketMsg.sendStops, graphs[system].stops);
      socket.emit(socketMsg.sendMergedStops, graphs[system].mergedGraph.stops);
    });
    
    socket.on(socketMsg.requestEdges, function(system) {
      socket.emit(socketMsg.sendEdges, graphs[system].edgesAsGeoJsonFeatures());
    });
    
    socket.on(socketMsg.requestMergedEdges, function(system) {
      socket.emit(socketMsg.sendMergedEdges, graphs[system].mergedGraph.edgesAsGeoJsonFeatures());
    });
    
    
    
    socket.on('error', function(err) {
      throw err;
    });
    
    socket.on(socketMsg.clearQueue, function() {
      graphTraverser.reset();
    });
    
    socket.on(socketMsg.startDfs, function(system, stopId) {
      graphTraverser.reset();
      logger.info(socketMsg.startDfs);

      traversals.dfs(graphs[system],graphs[system].getStopIndex(stopId),graphTraverser);
    });
    
    socket.on(socketMsg.startBfs, function(system, stopId) {
      graphTraverser.reset();
      logger.info(socketMsg.startBfs);
      
      traversals.bfs(graphs[system],graphs[system].getStopIndex(stopId),graphTraverser);
    });
    
    socket.on(socketMsg.startDijkstra, function(system, originId, destinationId) {
      graphTraverser.reset();
      logger.info(socketMsg.startDijkstra);
      
      traversals.dijkstra(graphs[system], graphs[system].getStopIndex(originId), graphs[system].getStopIndex(destinationId), graphTraverser);
    });
    
    socket.on(socketMsg.startPR, function(system) {
      graphTraverser.reset();
      logger.info(socketMsg.startPR);
      
      traversals.pageRank(graphs[system].mergedGraph,graphTraverser);
    });
  });
};

exports.close = function() {
  this.server.close();  
};

'use strict';

var http = require('http');
var path = require('path');
var express = require('express');
var socketio = require('socket.io');
var socketMsg = require('../constants.js');
var traversals = require('../graph/traversals.js');
var SocketTraverser = require('../graph/graphTraverser.js').SocketTraverser;
var logger = require('../logger.js');

var router = express();

// Set up Express to fetch the client from a subdirectory
router.use('/demo',express.static(path.resolve(__dirname, '../../public/demo')));
router.use('/',express.static(path.resolve(__dirname, '../../public/page-rank/nyc')));
router.use('/page-rank',express.static(path.resolve(__dirname, '../../public/page-rank/nyc')));
router.use('/page-rank/nyc',express.static(path.resolve(__dirname, '../../public/page-rank/nyc')));
router.use('/page-rank/boston',express.static(path.resolve(__dirname, '../../public/page-rank/boston')));

router.use('/bundle',express.static(path.resolve(__dirname, '../../public/bundle')));
router.use('/files',express.static(path.resolve(__dirname, '../../public/files')));

this.server = http.createServer(router);

exports.listen = function(SystemManager) {
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
      socket.emit(socketMsg.sendStops, SystemManager.getGraph(system).stops);
    });
    
    socket.on(socketMsg.requestMergedStops, function(system) {
      socket.emit(socketMsg.sendMergedStops, SystemManager.getGraph(system).getMergedStops());
    });
    
    socket.on(socketMsg.requestEdges, function(system) {
      socket.emit(socketMsg.sendEdges, SystemManager.getGraph(system).edgesAsGeoJsonFeatures());
    });
    
    socket.on(socketMsg.requestMergedEdges, function(system) {
      socket.emit(socketMsg.sendMergedEdges, SystemManager.getGraph(system).getMergedEdges());
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
      
      let graph = SystemManager.getGraph(system);

      traversals.dfs(graph,graph.getStopIndex(stopId),graphTraverser);
    });
    
    socket.on(socketMsg.startBfs, function(system, stopId) {
      graphTraverser.reset();
      logger.info(socketMsg.startBfs);
      
      let graph = SystemManager.getGraph(system);
      
      traversals.bfs(graph,graph.getStopIndex(stopId),graphTraverser);
    });
    
    socket.on(socketMsg.startDijkstra, function(system, originId, destinationId) {
      graphTraverser.reset();
      logger.info(socketMsg.startDijkstra);
      
      let graph = SystemManager.getGraph(system);
      
      traversals.dijkstra(graph, graph.getStopIndex(originId), graph.getStopIndex(destinationId), graphTraverser);
    });
    
    socket.on(socketMsg.startPR, function(system) {
      graphTraverser.reset();
      logger.info(socketMsg.startPR);
      
      let graph = SystemManager.getGraph(system);
      
      if (typeof graph.mergedGraph === "undefined") {
        traversals.pageRank(graph, graphTraverser);
      } else {
        traversals.pageRank(graph.mergedGraph, graphTraverser);
      }
    });
  });
};

exports.close = function() {
  this.server.close();  
};

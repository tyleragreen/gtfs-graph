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

const DEFAULT_IP = "0.0.0.0";
const DEFAULT_PORT = 3000;

// Set up Express to fetch the client from a subdirectory
router.use('/demo',express.static(path.resolve(__dirname, '../../public/demo')));
router.use('/',express.static(path.resolve(__dirname, '../../public/rank/nyc')));
router.use('/rank',express.static(path.resolve(__dirname, '../../public/rank/nyc')));
router.use('/rank/nyc',express.static(path.resolve(__dirname, '../../public/rank/nyc')));
router.use('/rank/boston',express.static(path.resolve(__dirname, '../../public/rank/boston')));
router.use('/rank/paris',express.static(path.resolve(__dirname, '../../public/rank/paris')));

router.use('/bundle',express.static(path.resolve(__dirname, '../../public/bundle')));
router.use('/files',express.static(path.resolve(__dirname, '../../public/files')));

this.server = http.createServer(router);

exports.listen = function(SystemManager) {
  var io = socketio.listen(this.server);
  logger.info("Starting server");
  
  this.server.listen(process.env.PORT || DEFAULT_PORT, process.env.IP || DEFAULT_IP, function() {
    var addr = this.address();
    logger.info("Server listening at", addr.address + ":" + addr.port);
    
    // Run the ranking algorithms on each graph.
    // This must happen after the server boots because it is a bottleneck.
    // This call will store the rank results inside each graph itself because WHY NOT.
    SystemManager.analyzeGraphs();
  });
  
  io.on('connection', function (socket) {
    socket.emit(socketMsg.log, 'Connected to the server!');
    
    // Create a traverser that is specific to this socket connection
    var graphTraverser = new SocketTraverser(socket);
    
    socket.on(socketMsg.requestSystem, function(systemId) {
      socket.emit(socketMsg.sendSystem, SystemManager.getInfo(systemId));
    });
    
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
      
      graph.dijkstra(graph.getStopIndex(originId), graph.getStopIndex(destinationId), graphTraverser);
    });
    
    socket.on(socketMsg.getMode, function(system, mode) {
      graphTraverser.reset();
      logger.info(socketMsg.getMode,':',mode);
      
      const graph = SystemManager.getGraph(system);
      
      const ranks = graph.ranks[mode];
      
      if (typeof ranks === "undefined") {
        throw new Error('Bad mode: ' + mode);
      }
      
      graphTraverser.recordRanks(ranks);
    
      //traversals.findCriticalEdges(graph);
    });
  });
};

exports.close = function() {
  this.server.close();  
};
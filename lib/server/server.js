'use strict';

var http = require('http');
var path = require('path');
var express = require('express');
var socketio = require('socket.io');
var socketMsg = require('../constants.js');
var traversals = require('transit-tools').traversals;
var SocketTraverser = require('./socketTraverser.js');
var logger = require('../logger.js');
var Mode = require('../enums').Mode;
var GraphType = require('../enums').GraphType;
var utils = require('../utils');

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
router.use('/rank/dc',express.static(path.resolve(__dirname, '../../public/rank/dc')));
router.use('/rank/dcp',express.static(path.resolve(__dirname, '../../public/rank/dcp')));

router.use('/bundle',express.static(path.resolve(__dirname, '../../public/bundle')));
router.use('/files',express.static(path.resolve(__dirname, '../../public/files')));

this.server = http.createServer(router);

exports.listen = function(SystemManager, afterServerBoot) {
  var io = socketio.listen(this.server);
  logger.info("Starting server");
  
  this.server.listen(process.env.PORT || DEFAULT_PORT, process.env.IP || DEFAULT_IP, function() {
    var addr = this.address();
    logger.info("Server listening at", addr.address + ":" + addr.port);
    
    if (afterServerBoot) afterServerBoot();
  });
  
  //=================================================
  // Graph API Endpoints
  router.get('/api/v0/graph/:system', function(req, res) {
    const systemId = req.params.system;
    
    if (!SystemManager.systemExists(systemId)) {
      res.send(utils.errorToJson(`Bad system: ${systemId}`));
      return;
    }
    let type = req.query.type;
    let mode = req.query.mode;
    const filter = req.query.filter;

    if (typeof type !== "undefined") {
      if (GraphType.isValid(type.toUpperCase())) {
        type = GraphType[type.toUpperCase()];
      } else {
        res.send(utils.errorToJson(`Bad graph type: ${type}`));
      }
    } else {
      type = GraphType.PRIMARY;
    }
    
    if (typeof mode !== "undefined") {
      if (Mode.isValid(mode.toUpperCase())) {
        mode = Mode[mode.toUpperCase()];
        
        if (type !== GraphType.MERGED) {
          res.send(utils.errorToJson(`Mode can only be provded with MERGED graph!`));
          return;
        }
      } else {
        res.send(utils.errorToJson(`Bad mode: ${mode}`));
        return;
      }
    }
    
    if (typeof filter === "undefined") {
      res.send(SystemManager.getGraph(systemId, type).getGeoJson(mode));
    } else if (filter == "edges") {
      res.send(SystemManager.getGraph(systemId, type).getGeoJsonEdges());
    } else if (filter == "stops") {
      res.send(SystemManager.getGraph(systemId, type).getGeoJsonStops(mode));
    } else {
      res.send(utils.errorToJson(`Bad filter: ${filter}`));
    }
  });
  
  router.get('/api/v0/system/:system', function(req, res) {
    const systemId = req.params.system;
    
    if (!SystemManager.systemExists(systemId)) {
      res.send(utils.errorToJson(`Bad system: ${systemId}`));
      return;
    }
    
    res.send(SystemManager.getInfo(systemId));
  });
  
  //=================================================
  // Socket interface
  // This feature is Up in the Air. Except for use with
  // the graph traversals for animation, it is being
  // considered for deprecation.
  io.on('connection', function (socket) {
    socket.emit(socketMsg.log, 'Connected to the server!');
    
    // Create a traverser that is specific to this socket connection
    var graphTraverser = new SocketTraverser(socket);
    
    socket.on(socketMsg.requestSystem, function(systemId) {
      socket.emit(socketMsg.sendSystem, SystemManager.getInfo(systemId));
    });
    
    socket.on(socketMsg.requestStops, function(system) {
      socket.emit(socketMsg.sendStops, SystemManager.getGraph(system, GraphType.PRIMARY).stops);
    });
    
    socket.on(socketMsg.requestMergedStops, function(system) {
      socket.emit(socketMsg.sendMergedStops, SystemManager.getGraph(system, GraphType.MERGED).stops);
    });
    
    socket.on(socketMsg.requestEdges, function(system) {
      socket.emit(socketMsg.sendEdges, SystemManager.getGraph(system, GraphType.PRIMARY).getGeoJsonEdges());
    });
    
    socket.on(socketMsg.requestMergedEdges, function(system) {
      socket.emit(socketMsg.sendMergedEdges, SystemManager.getGraph(system, GraphType.MERGED).getGeoJsonEdges());
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
      
      let graph = SystemManager.getGraph(system, GraphType.PRIMARY);

      traversals.dfs(graph,graph.getStopIndex(stopId),graphTraverser);
    });
    
    socket.on(socketMsg.startBfs, function(system, stopId) {
      graphTraverser.reset();
      logger.info(socketMsg.startBfs);
      
      let graph = SystemManager.getGraph(system, GraphType.PRIMARY);
      
      traversals.bfs(graph,graph.getStopIndex(stopId),graphTraverser);
    });
    
    socket.on(socketMsg.startDijkstra, function(system, originId, destinationId) {
      graphTraverser.reset();
      logger.info(socketMsg.startDijkstra);
      
      let graph = SystemManager.getGraph(system, GraphType.PRIMARY);
      
      graph.dijkstra(graph.getStopIndex(originId), graph.getStopIndex(destinationId), graphTraverser);
    });
    
    socket.on(socketMsg.getMode, function(system, mode) {
      graphTraverser.reset();
      logger.info(socketMsg.getMode,':',mode);
      
      const graph = SystemManager.getGraph(system, GraphType.MERGED);
      
      const ranks = graph.ranks[mode];
      
      if (typeof ranks === "undefined") {
        throw new Error('Bad mode: ' + mode);
      }
      
      graphTraverser.recordRanks(ranks);
    });
  });
};

exports.close = function() {
  this.server.close();  
};
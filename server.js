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
var socketMsg = require('./public/js/constants.js');
var async = require('async');

var router = express();

var server = http.createServer(router);
var io = socketio.listen(server);

router.use(bodyParser.json()); // for parsing application/json
router.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Initialize a list of connections to this server
var graph;
var stops;
var stops_geojson = []; 

// Set up Express to fetch the client from a subdirectory
router.use(express.static(path.resolve(__dirname, 'public')));

function loadGraph(callback) {
  console.log("Initializing graph");
  createGraph(function(new_stops, new_graph) {
    stops = new_stops;
   
    for (var stop_index in stops) {
      stops_geojson.push({
        'type': 'Feature',
        'geometry': {
          'type': 'Point',
          'coordinates': [stops[stop_index].stop_lon, stops[stop_index].stop_lat]
        }
      });
    }
    stops_geojson = {
      'type': 'FeatureCollection',
      'features': stops_geojson
    };
    graph = new_graph;
    
    graph.on('visit', function() {
      console.log('CAUGHT EVENT');
    //eventQueue.push();
    });
    console.log('Graph initialized');
    callback();
  });
};

var startServer = function (callback) {
  console.log("Starting server");
  
  server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
    var addr = server.address();
    console.log("Server listening at", addr.address + ":" + addr.port);
  });
  
  io.on('connection', function (socket) {
    socket.emit(socketMsg.log, 'Connected to the server!');
    
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
      setInterval(function() {
        socket.emit('new edge', graph);
      }, 1000);
    });
  });
};

async.series([
  loadGraph,
  startServer
  ]);
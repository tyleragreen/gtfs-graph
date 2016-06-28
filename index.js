/* 

   Author: Tyler A. Green (greent@tyleragreen.com)
*/
var createGraph = require('./lib/createGraph.js');
var socketMsg = require('./public/js/constants.js');
var graphMsg = require('./lib/graphConstants.js');
var server = require('./lib/server.js');
var async = require('async');

// Initialize a list of connections to this server
var graph;
var stops;
var stops_geojson = [];
var eventQueue;// = new EventQueue();

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
    
    graph.on(graphMsg.visit, function(edge) {
      event = {
        type: socketMsg.visitNode,
        data: edge
      };
      eventQueue.push(event);
    });
    graph.on(graphMsg.leave, function(edge) {
      event = { 
        type: socketMsg.leaveNode,
        data: edge
      };
      eventQueue.push(event);
    });
    console.log('Graph initialized');
    callback();
  });
}

function startServer(callback) {
  server.listen();
}

async.series([
  loadGraph,
  startServer
  ]);
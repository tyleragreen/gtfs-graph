/* 
  Entry point for gtfs-graph

  Author: Tyler A. Green (greent@tyleragreen.com)
*/
var createGraph = require('./lib/createGraph.js');
var server = require('./lib/server.js');
var async = require('async');

function loadGraph(callback) {
  console.log("Initializing graph");
  createGraph(function(graph) {
    console.log('Graph initialized');
    callback(null, graph);
  });
}

function startServer(graph, callback) {
  server.listen(graph);
}

async.waterfall([
  function(callback) { loadGraph(callback) },
  function(graph, callback) { startServer(graph, callback) }
  ]);
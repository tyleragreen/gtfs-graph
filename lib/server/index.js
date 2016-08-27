/* 
  Entry point for gtfs-graph

  Author: Tyler A. Green (greent@tyleragreen.com)
*/

var createGraph = require('./createGraph.js');
var server = require('./server.js');
var async = require('async');
var logger = require('./logger');

function loadGraph(callback) {
  logger.info("Initializing graph");
  createGraph(function(graph, mergedGraph) {
    logger.info('Graph initialized');
    callback(null, graph, mergedGraph);
  });
}

function startServer(graph, mergedGraph, callback) {
  server.listen(graph, mergedGraph);
}

async.waterfall([
  function(callback) { loadGraph(callback); },
  function(graph, mergedGraph, callback) { startServer(graph, mergedGraph, callback); }
  ]);
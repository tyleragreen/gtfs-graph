/* 
  Entry point for gtfs-graph

  Author: Tyler A. Green (greent@tyleragreen.com)
*/
var createGraph = require('./lib/createGraph.js');
var server = require('./lib/server.js');
var async = require('async');
var logger = require('./lib/logger');

function loadGraph(callback) {
  logger.info("Initializing graph");
  createGraph(function(graph) {
    logger.info('Graph initialized');
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
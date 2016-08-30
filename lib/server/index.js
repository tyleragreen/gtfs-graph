'use strict';
/* 
  Entry point for gtfs-graph

  Author: Tyler A. Green (greent@tyleragreen.com)
*/

var createGraph = require('./createGraph.js');
var createBostonGraph = require('./createBostonGraph.js');
var server = require('./server.js');
var async = require('async');
var logger = require('./logger');
var Systems = require('../systems');
var System = require('./system');
var SystemManager = require('./systemManager');

const graphs = {};

function loadGraphs(callback) {
  async.parallel([
    function(callback) {
      logger.info("Populating SystemManager");
      
      for (let system in Systems) {
        SystemManager.add(new System(system, Systems[system].latitude, Systems[system].longitude));
      }
      callback();
    },
    function(callback) {
      logger.info("NYC: Initializing graph");
      createGraph(function(graph, mergedGraph) {
        logger.info('NYC: Graph initialized');
        graphs.new_york = graph;
        callback();
      });
    },
    function(callback) {
      logger.info('Boston: Initializing graph');
      createBostonGraph(function(graph, mergedGraph) {
        logger.info('Boston: Graph initialized');
        graphs.boston = graph;
        callback();
      });
    }
  ], function(err) {
    if (err) throw err;
    
    for (var graph in graphs) {
      logger.info(graph + ' num. nodes: ' + graphs[graph].length());
    }
    callback();
  });
}

function startServer(callback) {
  server.listen(graphs, SystemManager);
}

async.series([
    function(callback) { loadGraphs(callback); },
    function(callback) { startServer(callback); }
  ]);
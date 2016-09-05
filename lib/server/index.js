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
      for (let system in Systems) {
        logger.info(system + ": Initializing graph");
        createGraph(system, Systems[system], function(graph, mergedGraph) {
          logger.info(system + ': Graph initialized');
          SystemManager.setGraph(system, graph);
          callback();
        });
      }
    },
  ], function(err) {
    if (err) throw err;
    
    callback();
  });
}

function startServer(callback) {
  server.listen(SystemManager);
}

async.series([
    function(callback) { loadGraphs(callback); },
    function(callback) { startServer(callback); }
  ]);
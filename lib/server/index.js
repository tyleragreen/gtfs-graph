'use strict';
/* 
  Entry point for gtfs-graph

  Author: Tyler A. Green (greent@tyleragreen.com)
*/

var createGraph = require('./createGraph.js');
var server = require('./server.js');
var async = require('async');
var logger = require('../logger');
var Systems = require('../systems');
var System = require('./system');
var SystemManager = require('./systemManager');

function loadGraphs(callback) {
  logger.info("Populating SystemManager");
  
  let createGraphs = [];
  for (let systemId in Systems) {
    let system = Systems[systemId];
    SystemManager.add(new System(systemId, system.location, system.latitude, system.longitude));
    
    createGraphs.push(function(callback) {
      logger.info(systemId + ": Initializing graph");
      createGraph(systemId, system, function(graph) {
        logger.info(systemId + ': Graph initialized');
        SystemManager.setGraph(systemId, graph);
        callback();
      });
    });
  }
  
  async.parallel(createGraphs, function(err) {
    if (err) { throw err; }
    
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
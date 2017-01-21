'use strict';

/*
  ===================================================
  
  Entry point for gtfs-graph

  Author: Tyler A. Green (greent@tyleragreen.com)
  
  ===================================================
*/

var createGraph = require('./createGraph.js');
var server = require('./server.js');
var async = require('async');
var logger = require('../logger');
var Systems = require('../systems');
var System = require('./system');
var SystemManager = require('./systemManager');
var Verbosity = require('../enums').Verbosity;
var argv = require('minimist')(process.argv.slice(2));

const DEFAULT_VERBOSITY = Verbosity.info;

function loadSystem(systemId) {
  return (typeof argv.system === "undefined" || argv.system.toUpperCase() === systemId);
}

if (typeof argv.verbosity !== "undefined") {
  logger.transports.console.level = Verbosity[argv.verbosity.toLowerCase()];
} else {
  logger.transports.console.level = DEFAULT_VERBOSITY;
}

function loadGraphs(callback) {
  logger.info("Populating SystemManager");
  
  let createGraphs = [];
  for (let systemId in Systems) {
    // Add this system to the SystemManager if it has been specified on the
    // command line (for debugging) or none has been specified (production behavior)
    if (loadSystem(systemId)) {
      let system = Systems[systemId];
      SystemManager.add(new System(systemId, system.location, system.latitude, system.longitude));
      
      createGraphs.push(function(callback) {
        logger.info(systemId + ": Initializing graph");
        createGraph(systemId, system, function(graph, mergedGraph) {
          logger.info(systemId + ': Graph initialized');
          SystemManager.setPrimaryGraph(systemId, graph);
          SystemManager.setMergedGraph(systemId, mergedGraph);
          callback();
        });
      });
    }
  }
  
  async.parallel(createGraphs, function(err) {
    if (err) { throw err; }
    
    callback();
  }); 
}

function startServer(callback) {
    
  function afterServerBoot() {
    // Run the ranking algorithms on each graph.
    // This must happen after the server boots because it is a bottleneck.
    // This call will store the rank results inside each graph itself because WHY NOT.
    SystemManager.analyzeGraphs();
  }
  
  server.listen(SystemManager, afterServerBoot);
}

async.series([
    function(callback) { loadGraphs(callback); },
    function(callback) { startServer(callback); }
  ]);
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
  for (let system in Systems) {
    SystemManager.add(new System(system, Systems[system].location, Systems[system].latitude, Systems[system].longitude));
    
    createGraphs.push(function(callback) {
      logger.info(system + ": Initializing graph");
      createGraph(system, Systems[system], function(graph) {
        logger.info(system + ': Graph initialized');
        SystemManager.setGraph(system, graph);
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
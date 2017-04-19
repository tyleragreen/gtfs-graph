'use strict';

var pg = require('pg');
var async = require('async');
var TransitGraph = require('transit-tools').TransitGraph;
var Stop = require('transit-tools').Stop;
var Route = require('transit-tools').Route;
var Edge = require('transit-tools').Edge;
var EdgeList = require('transit-tools').EdgeList;
var traversals = require('transit-tools').traversals;

var logger = require('../logger');

var stopsQuery = 'SELECT * FROM stops_view';
var routesQuery = 'SELECT * FROM routes_view';
var edgesQuery = 'SELECT * FROM edges_view';

var getStops = function(client, callback) {
  var stops = [];
  var query = client.query(stopsQuery);
  query.on('error', function(err) {
    callback(err, null);
  });
  query.on('row', function(row) {
    stops.push(new Stop(row.id, row.name, row.latitude, row.longitude));
  });
  query.on('end', function() {
    callback(null, stops);
  });
};

var getRoutesPerStop = function(client, stops, callback) {
  let stopIds = stops.map(stop => stop.id);
  let stopsWithRoutes = {};
  let query = client.query(routesQuery);
  query.on('error', function(err) {
    callback(err, null);
  });
  query.on('row', function(row) {
    let route = new Route(row.route_id, row.route_color);
    // Keep a running list per stop of the routes that it serves
    if (stopsWithRoutes[row.stop_id]) {
      stopsWithRoutes[row.stop_id].push(route);
    } else {
      stopsWithRoutes[row.stop_id] = [route];
    }
  });
  query.on('end', function() {
    // Save the routes found for each stop into the master stop list
    for (let stopId in stopsWithRoutes) {
      stops[stopIds.indexOf(stopId)].routes = stopsWithRoutes[stopId];
    }
    callback(null, stops);
  });
};

var getStopPairs = function(client, stops, callback) {
  const edgeList = new EdgeList();
  let numNodes = stops.length;
  let stopIds = stops.map(stop => stop.id);

  var query = client.query(edgesQuery);
  query.on('error', function(err) {
    callback(err, null);
  });
  query.on('row', function(row) {
    const originId = stopIds.indexOf(row.origin);
    const destId   = stopIds.indexOf(row.destination);
    
    if (originId !== -1 && destId !== -1) {
      // Look to see if we have already discovered this edge
      const existingEdge = edgeList.contains(originId, destId);
      
      // If we've seen this edge before, only use its duration if it is shorter
      // than what we've already seen (and it is NOT zero)
      if (existingEdge) {
        if (row.duration < existingEdge.weight && row.duration !== 0) {
          existingEdge.weight = row.duration;
        }
      // If we have not seen this edge before, add it to the graph
      } else {
        // Prevent edge weights of 0
        if (row.duration === 0) {
          row.duration = 60;
        }
        
        const newEdge = new Edge({
          type: row.type,
          origin: originId,
          destination: destId,
          weight: row.duration
        });
        edgeList.add(newEdge);
      }
    }
  });
  query.on('end', function() {
    callback(null, stops, edgeList, numNodes);
  });
};

function createViews(client, systemId, system, callback) {
  let views = [];
  for (let systemProperty in system) {
    if (systemProperty.match(/.*_view/)) {
      views.push(function(callback) {
        createView(client, systemId, system, systemProperty, callback);
      });
    }
  }

  async.parallel(views, function(err) {
    if (err) { throw err; }
    
    callback(null);
  });
}

function createView(client, systemId, system, view, callback) {
  let query = client.query("SELECT EXISTS(SELECT * FROM information_schema.tables WHERE table_name = '" + view + "')");
  
  query.on('row', function(row) {
    if (row.exists) {
      logger.info(systemId + ': view ' + view + ' exists');
      callback(null);
    } else {
      logger.info(systemId + ': view ' + view + ' doesn\'t exist');
      logger.info(systemId + ': creating view ' + view);
      let viewQuery = client.query('CREATE VIEW ' + view + ' AS ' + system[view]);
      
      viewQuery.on('end', function() {
        logger.info(systemId + ': view ' + view + ' created');
        callback(null);
      });
    }
  });
}

var createGraph = function(systemId, system, callback) {
  pg.connect(system.connectionString, function(err, client, done) {
    if (err) throw err;
  
    async.waterfall([
        function(callback) {
          createViews(client, systemId, system, callback);
        },
        function(callback) {
          getStops(client, callback);
        },
        function(stops, callback) {
          getRoutesPerStop(client, stops, callback);
        },
        function(stops, callback) {
          getStopPairs(client, stops, callback);
        }
      ],
      function(err, stops, edgeList, numNodes) {
        if (err) throw err;
        
        let graph = new TransitGraph(edgeList, numNodes, stops);
        let mergedGraph = traversals.mergeTransferNodes(graph);
        if (mergedGraph) {
          mergedGraph.calculatePathLengths();
          callback(graph, mergedGraph);
        } else {
          // If we don't have a merged graph, return the primary graph as the
          // merged graph.
          // This situation occurs when there are no 'transfer' edges in the graph.
          callback(graph, graph);
        }
        
        done();
      }
    );
  });
};

module.exports = createGraph;
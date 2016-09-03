'use strict';

var pg = require('pg');
var async = require('async');
var TransitGraph = require('./graph.js');
var Stop = require('./stop.js');
var traversals = require('./traversals.js');

var connectionString = 'postgres://thebusrider:3ll3board!@mta-gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/mta_gtfs';

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
    // Keep a running list per stop of the routes that it serves
    if (stopsWithRoutes[row.stop_id]) {
      stopsWithRoutes[row.stop_id].push(row.route_id);
    } else {
      stopsWithRoutes[row.stop_id] = [row.route_id];
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
  let edgeList = [];
  let numNodes = stops.length;
  let stopIds = stops.map(stop => stop.id);

  var query = client.query(edgesQuery);
  query.on('error', function(err) {
    callback(err, null);
  });
  query.on('row', function(row) {
    let newRow = {
      type: row.type,
      origin: stopIds.indexOf(row.origin),
      destination: stopIds.indexOf(row.destination),
      weight: row.duration
    };
    edgeList.push(newRow);
  });
  query.on('end', function() {
    callback(null, stops, edgeList, numNodes);
  });
};

var createGraph = function(connectionString, callback) {
  pg.connect(connectionString, function(err, client, done) {
    if (err) throw err;
  
    async.waterfall([
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
        graph.mergedGraph = mergedGraph;
        
        callback(graph);
        
        done();
      }
    );
  });
};

module.exports = createGraph;
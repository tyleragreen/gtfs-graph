'use strict';

var pg = require('pg');
var async = require('async');
var TransitGraph = require('./graph.js');
var traversals = require('./traversals.js');

var connectionString = 'postgres://thebusrider:3ll3board!@mta-gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/mta_gtfs';
// Do not select the duplicate directional stops (the ones that
// end with N or S)
var stopsQuery = 'SELECT stop_id AS id, stop_name AS name, stop_lat AS latitude, stop_lon AS longitude \
                   FROM stops \
                   WHERE stop_id NOT LIKE \'%N\' \
                    AND stop_id NOT LIKE \'%S\'';
                    
var routesQuery = 'SELECT DISTINCT substring(st.stop_id from 0 for char_length(st.stop_id)) AS stop_id, r.route_id AS route_id FROM stop_times st JOIN trips t ON st.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id';
// Select the subway edges and the transfers between subway stations
// For the subway stations, remove the N or S direction indicator from the
// stop_id
var edgesQuery = 'SELECT DISTINCT \
                    substring(st1.stop_id from 0 for char_length(st1.stop_id)) AS origin, \
                    substring(st2.stop_id from 0 for char_length(st2.stop_id)) AS destination, \
                    \'route\' AS type \
                   FROM stop_times st1 \
                   JOIN stop_times st2 \
                    ON st1.trip_id = st2.trip_id \
                   WHERE st2.stop_sequence = (st1.stop_sequence+1) \
                  UNION \
                   (SELECT \
                    from_stop_id AS origin, \
                    to_stop_id AS destination, \
                    \'transfer\' AS type \
                   FROM transfers \
                   WHERE from_stop_id != to_stop_id \
                   EXCEPT \
                    SELECT \
                     from_stop_id AS origin, \
                     to_stop_id AS destination, \
                     \'transfer\' AS type \
                     FROM transfers \
                     WHERE \
                      from_stop_id = \'B08\' \
                      AND to_stop_id = \'629\')';

var getStops = function(client, callback) {
  var stops = [];
  var query = client.query(stopsQuery);
  query.on('error', function(err) {
    callback(err, null);
  });
  query.on('row', function(row) {
    stops.push(row);
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
    console.log('row', row);
    let newRow = {
      type: row.type,
      edge: [stopIds.indexOf(row.origin), stopIds.indexOf(row.destination)]
    };
    edgeList.push(newRow);
  });
  query.on('end', function() {
    callback(null, stops, edgeList, numNodes);
  });
};

var createGraph = function(callback) {
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
        
        callback(graph, mergedGraph);
        
        done();
      }
    );
  });
};

module.exports = createGraph;
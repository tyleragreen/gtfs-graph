'use strict';

var pg = require('pg');
var async = require('async');
var TransitGraph = require('./graph.js');
var Stop = require('./stop.js');
var traversals = require('./traversals.js');

var connectionString = 'postgres://thebusrider:3ll3board!@gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/gtfs';
var stopsQuery = "SELECT stop_id AS id, stop_name AS name, stop_lat AS latitude, stop_lon AS longitude \
                   FROM stops WHERE location_type='t'";
var routesQuery = 'SELECT DISTINCT st.stop_id AS stop_id, r.route_id AS route_id FROM stop_times st JOIN trips t ON st.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id WHERE r.route_desc LIKE \'Rapid Transit\'';
var edgesQuery = 'SELECT DISTINCT \
                    st1.stop_id AS origin, \
                    st2.stop_id AS destination, \
                    \'route\' AS type, \
                    EXTRACT(EPOCH FROM st2.departure_time-st1.departure_time) AS duration \
                   FROM stop_times st1 \
                   JOIN stop_times st2 \
                    ON st1.trip_id = st2.trip_id \
                   JOIN trips t \
                    ON t.trip_id = st1.trip_id \
                   JOIN routes r \
                    ON t.route_id=r.route_id \
                   WHERE r.route_desc LIKE \'Rapid Transit\' \
                   AND st2.stop_sequence = (st1.stop_sequence+1)';

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
      if (stopIds.indexOf(stopId) === -1) {
      //  throw 'bad stop id: ' + stopId;
      }
      stops[stopIds.indexOf(stopId)].routes = stopsWithRoutes[stopId];
    }
    
    // Our list of routes has been filtered to only contain Rapid Transit routes
    // during the db query. Do the same for the list of stops
    let rapidTransitStops = stops.filter(function (stop) {
      return typeof stop.routes !== 'undefined';
    });
    callback(null, rapidTransitStops);
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
    if (row.type === 'route') {
      if (stopIds.indexOf(row.origin) === -1) { 
        console.log('origin', row.origin);
      }
      if (stopIds.indexOf(row.destination) === -1) {
        console.log('dest', row.destination);
      }
      let newRow = {
        type: row.type,
        origin: stopIds.indexOf(row.origin),
        destination: stopIds.indexOf(row.destination),
        weight: row.duration
      };
      edgeList.push(newRow);
    }
  });
  query.on('end', function() {
    callback(null, stops, edgeList, numNodes);
  });
};

var createBostonGraph = function(callback) {
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

module.exports = createBostonGraph;
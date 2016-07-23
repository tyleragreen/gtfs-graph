'use strict';

var pg = require('pg');
var async = require('async');
var TransitGraph = require('./graph.js');

var connectionString = 'postgres://thebusrider:3ll3board!@mta-gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/mta_gtfs';
// Do not select the duplicate directional stops (the ones that
// end with N or S)
var stopsQuery = 'SELECT stop_id, stop_name, stop_lat, stop_lon \
                   FROM stops \
                   WHERE stop_id NOT LIKE \'%N\' \
                    AND stop_id NOT LIKE \'%S\'';
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
                   SELECT \
                    from_stop_id AS origin, \
                    to_stop_id AS destination, \
                    \'transfer\' AS type \
                   FROM transfers \
                   WHERE from_stop_id != to_stop_id';

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

var getStopPairs = function(client, stops, callback) {
  let edgeList = [];
  let numNodes = stops.length;
  let stopIds = stops.map(stop => stop.stop_id);

  var query = client.query(edgesQuery);
  query.on('error', function(err) {
    callback(err, null);
  });
  query.on('row', function(row) {
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
          getStopPairs(client, stops, callback);
        }
      ],
      function(err, stops, edgeList, numNodes) {
        if (err) throw err;
        
        var graph = new TransitGraph(edgeList, numNodes, stops);
        
        callback(graph);
        
        done();
      }
    );
  });
};

module.exports = createGraph;
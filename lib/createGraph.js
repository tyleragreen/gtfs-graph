var pg = require('pg');
var async = require('async');
var Graph = require('./graph.js');

var connectionString = 'postgres://thebusrider:3ll3board!@mta-gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/mta_gtfs'

var getStops = function(client, callback) {
  var stops = [];
  var query = client.query('SELECT stop_id, stop_lat, stop_lon FROM stops WHERE stop_id NOT LIKE \'%N\' AND stop_id NOT LIKE \'%S\'');
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
  var edgeList = [];
  var numNodes = stops.length;
  
  var stop_ids = stops.map(stop => stop.stop_id);

  var query = client.query('SELECT DISTINCT st1.stop_id AS origin, st2.stop_id AS destination FROM stop_times st1 JOIN stop_times st2 ON st1.trip_id=st2.trip_id WHERE st2.stop_sequence=(st1.stop_sequence+1)');
  query.on('error', function(err) {
    callback(err, null);
  });
  query.on('row', function(row) {
    var new_row = [];
    for (var prop in row) {
      new_row.push(stop_ids.indexOf(row[prop].substring(0, row[prop].length-1)));
    }
    edgeList.push(new_row);
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
          getStops(client, callback)
        },
        function(stops, callback) {
          getStopPairs(client, stops, callback)
        }
      ],
      function(err, stops, edgeList, numNodes) {
        if (err) throw err;
        
        var graph = new Graph(edgeList, numNodes);
        
        callback(stops, graph);
        
        done();
      }
    );
  });
};

module.exports = createGraph;
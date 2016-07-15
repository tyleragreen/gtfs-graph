var pg = require('pg');
var async = require('async');
var TransitGraph = require('./graph.js').TransitGraph;

var connectionString = 'postgres://thebusrider:3ll3board!@mta-gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/mta_gtfs'

var getStops = function(client, callback) {
  var stops = [];
  var query = client.query('SELECT stop_id, stop_name, stop_lat, stop_lon FROM stops WHERE stop_id NOT LIKE \'%N\' AND stop_id NOT LIKE \'%S\'');
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

  var query = client.query('SELECT DISTINCT st1.stop_id AS origin, st2.stop_id AS destination, \'subway\' AS type FROM stop_times st1 JOIN stop_times st2 ON st1.trip_id=st2.trip_id WHERE st2.stop_sequence=(st1.stop_sequence+1) UNION SELECT from_stop_id AS origin, to_stop_id AS destination, \'transfer\' AS type FROM transfers WHERE from_stop_id!=to_stop_id');
  query.on('error', function(err) {
    callback(err, null);
  });
  query.on('row', function(row) {
    if (row.type == "subway") {
      var new_row = [stop_ids.indexOf(row.origin.substring(0, row.origin.length-1)), stop_ids.indexOf(row.destination.substring(0, row.destination.length-1))];
      edgeList.push(new_row);
    } else if (row.type == "transfer") {
      edgeList.push([stop_ids.indexOf(row.origin), stop_ids.indexOf(row.destination)]);
    } else {
      throw 'bad query result';
    }
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
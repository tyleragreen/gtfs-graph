var pg = require('pg');
var fs = require('fs');
var async = require('async');

var connectionString = 'postgres://thebusrider:3ll3board!@mta-gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/mta_gtfs'

pg.connect(connectionString, function(err, client, done) {
  if (err) throw err;

  var query = client.query('SELECT st1.stop_id AS origin, st2.stop_id AS destination FROM stop_times st1 JOIN stop_times st2 ON st1.trip_id=st2.trip_id WHERE st2.stop_sequence=(st1.stop_sequence+1)');
  query.on('row', function(row) {
    console.log(row);
  });
  done();
});

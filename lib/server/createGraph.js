'use strict';

var pg = require('pg');
var async = require('async');
var TransitGraph = require('./graph');
var Stop = require('./stop');
var traversals = require('./traversals');

var logger = require('./logger');

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
        //function(stops, callback) {
        //  getRoutesPerStop(client, stops, callback);
        //},
        //function(stops, callback) {
        //  getStopPairs(client, stops, callback);
        //}
      ],
      function(err, stops, edgeList, numNodes) {
        if (err) throw err;
        
        let graph = new TransitGraph(edgeList, numNodes, stops);
        //let mergedGraph = traversals.mergeTransferNodes(graph);
        //graph.mergedGraph = mergedGraph;
        
        callback(graph);
        
        done();
      }
    );
  });
};

module.exports = createGraph;
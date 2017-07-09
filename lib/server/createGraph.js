'use strict';

var async = require('async');
var readline = require('readline');
var fs = require('fs');
var TransitGraph = require('transit-tools').TransitGraph;
var Stop = require('transit-tools').Stop;
var Route = require('transit-tools').Route;
var Edge = require('transit-tools').Edge;
var EdgeList = require('transit-tools').EdgeList;
var traversals = require('transit-tools').traversals;
var assert = require('../utils.js').assert;

const NUM_STOPS_COLS = 4;
const NUM_ROUTES_COLS = 3;
const NUM_EDGES_COLS = 4;

const STOP_ID = 0;
const STOP_NAME = 1;
const STOP_LATITUDE = 2;
const STOP_LONGITUDE = 3;

const ROUTE_STOP_ID = 0;
const ROUTE_ID = 1;
const ROUTE_COLOR = 2;

const EDGE_ORIGIN = 0;
const EDGE_DESTINATION = 1;
const EDGE_TYPE = 2;
const EDGE_WEIGHT = 3;

var getStops = function(systemId, callback) {
  const stops = [];
  const lineReader = readline.createInterface({
    input: fs.createReadStream(`./data/${systemId.toLowerCase()}/stops.csv`)
  });
  
  lineReader.on('line', (line) => {
    const row = line.split(',');
    assert(row.length == NUM_STOPS_COLS, 'Unexpected format for stops.csv');
    
    let stop = new Stop(row[STOP_ID], row[STOP_NAME], parseFloat(row[STOP_LATITUDE]), parseFloat(row[STOP_LONGITUDE]));
    stops.push(stop);
  });
  
  lineReader.on('close', () => {
    callback(null, stops);
  });
  
  // Actually start reading the file
  lineReader.resume();

};

var getRoutes = function(systemId, stops, callback) {
  let stopIds = stops.map(stop => stop.id);
  let stopsWithRoutes = {};
  
  const lineReader = readline.createInterface({
    input: fs.createReadStream(`./data/${systemId.toLowerCase()}/routes.csv`)
  });
  
  lineReader.on('line', (line) => {
    const row = line.split(',');
    assert(row.length == NUM_ROUTES_COLS, 'Unexpected format for routes.csv');
    
    let route = new Route(row[ROUTE_ID], row[ROUTE_COLOR]);
    let stop_id = row[ROUTE_STOP_ID];
    
    if (stopsWithRoutes[stop_id]) {
      stopsWithRoutes[stop_id].push(route);
    } else {
      stopsWithRoutes[stop_id] = [ route ];
    }
  });
  
  lineReader.on('close', () => {
    // Save the routes found for each stop into the master stop list
    for (let stopId in stopsWithRoutes) {
      stops[stopIds.indexOf(stopId)].routes = stopsWithRoutes[stopId];
    }
    callback(null, stops);
  });
  
  // Actually start reading the file
  lineReader.resume();
  
};

var getEdges = function(systemId, stops, callback) {
  const edgeList = new EdgeList();
  let numNodes = stops.length;
  let stopIds = stops.map(stop => stop.id);
  
  const lineReader = readline.createInterface({
    input: fs.createReadStream(`./data/${systemId.toLowerCase()}/edges.csv`)
  });

  lineReader.on('line', (line) => {
    const row = line.split(',');
    assert(row.length == NUM_EDGES_COLS, 'Unexpected format for edges.csv');
    
    const originId = stopIds.indexOf(row[EDGE_ORIGIN]);
    const destId   = stopIds.indexOf(row[EDGE_DESTINATION]);
    
    if (originId !== -1 && destId !== -1) {
      // Look to see if we have already discovered this edge
      const existingEdge = edgeList.contains(originId, destId);
      const type = row[EDGE_TYPE];
      let weight = parseInt(row[EDGE_WEIGHT]);
      
      // If we've seen this edge before, only use its duration if it is shorter
      // than what we've already seen (and it is NOT zero)
      if (existingEdge) {
        if (weight < existingEdge.weight && weight !== 0) {
          existingEdge.weight = weight;
        }
      // If we have not seen this edge before, add it to the graph
      } else {
        // Prevent edge weights of 0
        if (weight === 0) {
          weight = 60;
        }
        
        const newEdge = new Edge({
          type: type,
          origin: originId,
          destination: destId,
          weight: weight
        });
        edgeList.add(newEdge);
      }
    }
  });
  
  lineReader.on('close', () => {
    callback(null, stops, edgeList, numNodes);
  });
  
  // Actually start reading the file
  lineReader.resume();
};

var createGraph = function(systemId, system, callback) {
  async.waterfall([
      function(callback) {
        getStops(systemId, callback);
      },
      function(stops, callback) {
        getRoutes(systemId, stops, callback);
      },
      function(stops, callback) {
        getEdges(systemId, stops, callback);
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
    }
  );
};

module.exports = createGraph;
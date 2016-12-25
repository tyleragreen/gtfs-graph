'use strict';

var Edge = require('./edge');
var EdgeList = require('./edgeList');
var Matrix = require('./matrix');
var logger = require('../logger');
var utils = require('../utils');
var Path = require('./path');
var Geometry = require('../enums').Geometry;
var EdgeType = require('../enums').EdgeType;

// Choose the path distance to be the length of the A line
const PATH_DISTANCE = 66;

const DEFAULT_RANDOM_EDGE_WEIGHT = 120;
const DEFAULT_RANDOM_EDGE_TYPE   = EdgeType.THEORETICAL;

const EDGE_COLOR = {
  [EdgeType.THEORETICAL]: '#ff0000',
  [EdgeType.ROUTE]: '#555555',
  [EdgeType.TRANSFER]: '#708090'
};

class TransitGraph {
  
  //-------------------------------------------------
  constructor(edgeList, numNodes, stops) {
    validateEdgeList(edgeList);
    
    utils.checkType(edgeList, EdgeList);
    this.edgeList = edgeList;
    this.numNodes = numNodes;
    this.stops = stops;
    this.G = this.toGraph();
    this.incomingNodes = this.calculateIncomingNodes();
    this.distanceMatrix = new Matrix(this.length());
    
    // A transit graph is not allowed to contain negative edges
    function validateEdgeList(edgeList) {
      const negativeEdges = edgeList.filter(edge => edge.weight < 0);
      
      if (negativeEdges.length > 0) { throw new Error('negative edge weight detected!'); }
    }
  }
  
  //-------------------------------------------------
  //getGraphToUse() {
  //  if (typeof this.mergedGraph === "undefined") {
  //    return this;
  //  } else {
  //    return this.mergedGraph;
  //  }
  //}
  
  //-------------------------------------------------
  length() {
    return this.G.length();
  }
  
  diversityEntropy(origin, distance) {
    let sum = 0;
    for (let node = 0; node < this.length(); node++) {
      // Only calcuate the entropy from the origin node to all other nodes
      // in the graph (excluding itself, which would always be reached with
      // a path of distance 0).
      if (node !== origin) {
        const P = this.transitionProbability(node, origin, distance);
        
        if (P !== 0) {
          sum += P * Math.log(P);
        }
      }
    }
    
    return -sum;
  }
  
  transitionProbability(j, origin, distance) {
    const randomWalks = this.getRandomWalksFrom(origin);
    const numerator = randomWalks.filter(walk => walk.at(distance) === j);
    
    return numerator.length / randomWalks.length;
  }
  
  calculateRandomWalks(count, distance) {
    this.randomWalks = {};
    
    for (let node = 0; node < this.length(); node++) {
      this.calculateRandomWalksFrom(node, count, distance);
    }
  }
  
  calculateRandomWalksFrom(node, count, distance, deadEndsContribute) {
    if (typeof this.randomWalks === "undefined") {
      this.randomWalks = {};
    }
    if (typeof deadEndsContribute === "undefined") {
      deadEndsContribute = false;
    }
    
    let iteration = count;
    const randomWalks = [];
    while (iteration--) {
      const path = this.randomWalk(node, distance, deadEndsContribute);
      randomWalks.push(path);
    }
    this.randomWalks[node] = randomWalks;
  }
  
  getRandomWalksFrom(node) {
    return this.randomWalks[node];
  }
  
  // A self-avoiding random walk of a given length from a given origin
  randomWalk(origin, walkLength, deadEndsContribute) {
    if (walkLength <= 0) { throw new Error('Distance of a random walk must be positive'); }
    const path = new Path();
    path.add(origin);
    let distance = walkLength;
  
    while (distance--) {
      const nodes = this.getIncomingNodes(origin);
      const unvisitedNodes = [];
      
      nodes.forEach(function(node, i) {
        if (!path.contains(node)) {
          unvisitedNodes.push(node);
        }
      });
      // Return the path early if our walk has reached a dead end, after
      // appending -1s to the end
      if (unvisitedNodes.length === 0) { 
        if (deadEndsContribute) {
          path.fillTo(walkLength, origin);
        } else {
          path.fillTo(walkLength, -1);
        }
        return path;
      }
      
      let nextNode = unvisitedNodes[utils.rand(unvisitedNodes.length)];
      path.add(nextNode);
      
      origin = nextNode;
    }
    
    return path;
  }
  
  //-------------------------------------------------
  getNodeAccessibility(origin, distance) {
    return Math.exp(this.diversityEntropy(origin, distance)) / (this.length() - 1);
  }
  
  getNodeAccessibilities(origin) {
    let distance = PATH_DISTANCE;
    const accessibilities = [];
    
    while (distance--) {
      accessibilities.push(this.getNodeAccessibility(origin, distance));
    }
    
    return accessibilities;
  }
  
  //-------------------------------------------------
  getShortestPath(origin, destination) {
    if (!this.distanceMatrix.get(origin, destination)) {
      let distancesToOrigin = this.dijkstra(origin, destination);
      
      this.distanceMatrix.setRow(origin, distancesToOrigin);
    }
    
    return this.distanceMatrix.get(origin, destination);
  }

  //-------------------------------------------------
  // Fill the distance matrix with pairwise distance
  // calculations
  // FIXME - we probably don't need this.length() iterations,
  // maybe only half?
  calculatePathLengths() {
    for (let i = 0; i < this.length(); i++) {
      let distancesToOrigin = this.dijkstra(i);
      
      this.distanceMatrix.setRow(i, distancesToOrigin);
    }
  }
  
  getTransferGraph() {
    return new TransitGraph(this.getTransferEdges(), this.numNodes, this.stops);
  }
  
  //-------------------------------------------------
  calculateIncomingNodes() {
    let incomingNodes;
    for (incomingNodes = []; incomingNodes.length < this.length(); incomingNodes.push([]));
    
    for (let i = 0; i < this.length(); i++) {
      for (let j = 0; j < this.length(); j++) {
        if (this.edgeExists(i, j)) { incomingNodes[j].push(i); }
      }
    }
    
    return incomingNodes;
  }
  
  //-------------------------------------------------
  getIncomingNodes(index) {
    if (index > this.length()) { throw 'bad index'; }
    
    return this.incomingNodes[index];
  }
  
  //-------------------------------------------------
  edgeExists(vert, horz) {
    return (this.getEdge(vert, horz)) ? true : false;
  }
  
  //-------------------------------------------------
  getWeight(vert, horz) {
    const edge = this.getEdge(vert, horz);
    
    if (edge) {
      return edge.weight;
    } else {
      throw new Error('edge does not exist!');
    }
  }
  
  //-------------------------------------------------
  getEdge(vert, horz) {
    return this.G.get(vert, horz);
  }
  
  //-------------------------------------------------
  //etMergedStops() {
  // if (typeof this.mergedGraph !== "undefined") {
  //   return this.mergedGraph.stops;
  // } else {
  //   return this.stops;
  // }
  //
  //
  ///-------------------------------------------------
  //etMergedEdges() {
  // if (typeof this.mergedGraph !== "undefined") {
  //   return this.mergedGraph.edgesAsGeoJsonFeatures();
  // } else {
  //   return this.edgesAsGeoJsonFeatures();
  // }
  //
  
  //-------------------------------------------------
  // Copy the type and weight of the existing edge, but create a new edge object
  // to ensure we represent the correct direction of traversal
  createEdge(origin, destination) {
    let existingEdge = this.getEdge(origin, destination);
    let originStop = this.stops[origin];
    let destinationStop = this.stops[destination];
    return new Edge({origin: originStop, destination: destinationStop, type: existingEdge.type, weight: existingEdge.weight});
  }
  
  //-------------------------------------------------
  getStopIds() {
    return this.stops.map(stop => stop.id);
  }
  
  //-------------------------------------------------
  getStopIndex(stopId) {
    var stopIndex = this.getStopIds().indexOf(stopId);
    if (stopIndex === -1) { throw 'bad stop id ' + stopId; }
    
    return stopIndex;
  }
  
  //-------------------------------------------------
  getTransferEdges() {
    return this.edgeList.filter(edge => edge.type === EdgeType.TRANSFER);
  }
  
  //-------------------------------------------------
  // Create an adjacency matrix out of the edge list,
  // preserving the edge type and weight
  toGraph() {
    const graph = new Matrix(this.numNodes);
    
    this.edgeList.forEach(function(edge) {
      graph.set(edge.origin, edge.destination, edge);
    });
  
    return graph;
  }
  
  getRandomNode() {
    return utils.rand(this.length());
  }
  
  createRandomEdge() {
    const origin = this.getRandomNode();
    const destination = this.getRandomNode();
    
    return new Edge({
      origin: origin,
      destination: destination,
      weight: DEFAULT_RANDOM_EDGE_WEIGHT,
      type: DEFAULT_RANDOM_EDGE_TYPE
    });
  }
  
  //-------------------------------------------------
  // Return a GeoJSON representation of the edges
  getGeoJsonEdges() {
    const edgesGeoJson = [];
    const stops = this.stops;
    
    this.edgeList.forEach(function(edge) {
      const originNode = stops[edge.origin];
      const destNode   = stops[edge.destination];
      
      edgesGeoJson.push({
        'type': 'Feature',
        'properties': {
          'edgeType': edge.type,
          'stroke': EDGE_COLOR[edge.type]
        },
        'geometry': {
          'type': Geometry.LineString,
          'coordinates': [
              [ originNode.longitude, originNode.latitude ],
              [ destNode.longitude, destNode.latitude ]
            ]
        }
      });
    });
    return {
      'type': 'FeatureCollection',
      'features': edgesGeoJson
    };
  }
  
  //-------------------------------------------------
  // Return a GeoJSON representation of the stops
  getGeoJsonStops(mode) {
    var geoJson = [];
    var that = this;
    
    this.stops.forEach(function(stop,index) {
      let feature = {
        'type': 'Feature',
        'properties': {
          'id': stop.id,
          'name': stop.name,
          'routes': stop.routes,
        },
        'geometry': {
          'type': Geometry.Point,
          'coordinates': [stop.longitude, stop.latitude]
        }
      };
      
      if (mode) {
        feature.properties.rank = that.ranks[mode][index];
        feature.properties['marker-color'] = '#ff0000';
      }
      
      geoJson.push(feature);
    });
    
    return {
      'type': 'FeatureCollection',
      'features': geoJson
    };
  }
  
  //-------------------------------------------------
  getRanksJson(mode) {
    const json = {};
    var that = this;
    
    if (typeof mode === "undefined") {
      throw new Error('mode is required.');
    }
    
    this.stops.forEach(function(stop,index) {
      json[stop.id] = that.ranks[mode][index];
    });
    
    return json;
  }
  
  //-------------------------------------------------
  // Return a GeoJSON representation of the graph
  getGeoJson(mode) {
    const stops = this.getGeoJsonStops(mode).features;
    const edges = this.getGeoJsonEdges().features;
    
    // Append the edge features to the stop features
    const geoJson = stops.concat(edges);
    
    return {
      'type': 'FeatureCollection',
      'features': geoJson
    };
  }
  
  createNewGraphWithEdges(newEdges) {
    const edgeList = this.edgeList.append(newEdges);
    const numNodes = this.length();
    const stops    = this.stops;
    
    return new TransitGraph(edgeList, numNodes, stops);
  }
  
  dijkstra(start, end, traverser) {
    const MAX = Infinity;
    let minIndex, minDistance;
    let iterations = this.length();
    let S, D, P;
    
    for (S = []; S.length < this.length(); S.push(MAX));
    for (D = []; D.length < this.length(); D.push(false));
    for (P = []; P.length < this.length(); P.push(0));
    
    S[start] = 0;
    
    while (iterations--) {
      minDistance = MAX;
      for (let i=0; i < this.length(); i++) {
        if (S[i] < minDistance && !D[i]) {
          minDistance = S[i];
          minIndex = i;
        }
      }
      if (minDistance === MAX) break;
      D[minIndex] = true;
      
      for (let i=0; i < this.length(); i++) {
        if (this.edgeExists(minIndex,i) && S[i] > S[minIndex] + this.getWeight(minIndex,i)) {
          S[i] = S[minIndex] + this.getWeight(minIndex,i);
          P[i] = minIndex;
        }
      }
    }
    
    // These steps should only happen if an end node is provided
    if (end) {
      if (S[end] === MAX) {
        logger.info('No path between ' + start + ' and ' + end + '.');
      } else {
        logger.info('Path length between ' + start + ' and ' + end + ' is ' + S[end] + '.');
      }
      
      const path = new Path();
      let i = end;
      let pathDetectIterations = 0;
      
      // Determine the shortest path by traversing the index array P
      while (P[i] !== 0) {
        path.add(this.createEdge(P[i],i));
        i = P[i];
        
        pathDetectIterations++;
        if (pathDetectIterations > this.length()) {
          throw new Error('cycle detected during shortest path calculation!');
        }
      }
      
      if (traverser) {
        path.reverse().forEach(function(edge) {
          traverser.visit(edge);
        });
        
        traverser.summary({ pathLength: S[end]});
      }
    }
    
    return S;
  }

}

module.exports = TransitGraph;
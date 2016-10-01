'use strict';

var Edge = require('./edge');
var Matrix = require('./matrix');
var logger = require('../logger');

class TransitGraph {
  
  //-------------------------------------------------
  constructor(edgeList, numNodes, stops) {
    this.edgeList = edgeList;
    this.numNodes = numNodes;
    this.stops = stops;
    this.G = this.toGraph();
    this.incomingNodes = this.calculateIncomingNodes();
    this.distanceMatrix = new Matrix(this.length());
  }
  
  //-------------------------------------------------
  length() {
    return this.G.length;
  }
  
  //-------------------------------------------------
  getShortestPath(origin, destination) {
    console.log(this.distanceMatrix.get(origin, destination));
    if (!this.distanceMatrix.get(origin, destination)) {
      let distancesToOrigin = this.dijkstra(origin, destination);
      
      this.distanceMatrix.setRow(origin, distancesToOrigin);
    }
    
    return this.distanceMatrix.get(origin, destination);
  }
  
  calculatePathLengths() {
    console.log('LENGTH',this.length());
    for (let i = 0; i < this.length(); i++) {
      console.log('i',i);
      let distancesToOrigin = this.dijkstra(i, 0);
      console.log('distances',distancesToOrigin);
      
      this.distanceMatrix.setDistances(i, distancesToOrigin);
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
    if (vert < horz && this.G[horz][vert] !== 0) {
      return true;
    } else if (vert > horz && this.G[vert][horz] !== 0) {
      return true;
    } else {
      return false;
    }
  }
  
  //-------------------------------------------------
  getEdge(vert, horz) {
    if (vert < horz && this.G[horz][vert] !== 0) {
      return this.G[horz][vert];
    } else if (vert > horz && this.G[vert][horz] !== 0) {
      return this.G[vert][horz];
    } else {
      return null;
    }
  }
  
  //-------------------------------------------------
  getMergedStops() {
    if (typeof this.mergedGraph !== "undefined") {
      return this.mergedGraph.stops;
    } else {
      return this.stops;
    }
  }
  
  getMergedEdges() {
    if (typeof this.mergedGraph !== "undefined") {
      return this.mergedGraph.edgesAsGeoJsonFeatures();
    } else {
      return this.edgesAsGeoJsonFeatures();
    }
  }
  
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
  getWeight(vert, horz) {
    if (vert < horz && this.G[horz][vert] !== 0) {
      return this.G[horz][vert].weight;
    } else if (vert > horz && this.G[vert][horz] !== 0) {
      return this.G[vert][horz].weight;
    } else {
      throw 'edge does not exist!';
    }
  }
  
  //-------------------------------------------------
  getTransferEdges() {
    return this.edgeList.filter(edge => edge.type === 'transfer');
  }
  
  //-------------------------------------------------
  // Create an adjacency matrix out of the edge list,
  // preserving the edge type and weight
  toGraph() {
    const graph = [];
  
    for (let i = 0; i < this.numNodes; i++) {
      graph.push([]);
      for (let j = 0; j < this.numNodes; j++) {
        if (j < i) {
          graph[i][j] = 0;
        }
      }
    }
    
    for (let edgeIndex in this.edgeList) {
      let edge = this.edgeList[edgeIndex];
      let max = Math.max(edge.origin,edge.destination);
      let min = Math.min(edge.origin,edge.destination);

      graph[max][min] = edge;
    }
    return graph;
  }
  
  //-------------------------------------------------
  // Return the list of edges as GeoJSON, including 
  // an edgeType property for each edge
  edgesAsGeoJsonFeatures() {
    const edgesGeoJson = [];
    
    for (let edgeIndex = 0; edgeIndex < this.edgeList.length; edgeIndex++) {
      let edge = this.edgeList[edgeIndex];
      let originNode = this.stops[edge.origin];
      let destNode = this.stops[edge.destination];
      
      edgesGeoJson.push({
        'type': 'Feature',
        'properties': {
          'edgeType': edge.type
        },
        'geometry': {
          'type': 'LineString',
          'coordinates': [
              [ originNode.longitude, originNode.latitude ],
              [ destNode.longitude, destNode.latitude ]
            ]
        }
      });
    }
    return {
      'type': 'FeatureCollection',
      'features': edgesGeoJson
    };
  }
  
  dijkstra(start, end, traverser) {
    const MAX = Infinity;
    for (var S = []; S.length < this.length(); S.push(MAX));
    for (var D = []; D.length < this.length(); D.push(false));
    for (var P = []; P.length < this.length(); P.push(0));
    
    var minIndex, minDistance;
    var iterations = this.length();
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
    
    if (S[end] === MAX) {
      logger.info('No path between ' + start + ' and ' + end + '.');
    } else {
      logger.info('Path length between ' + start + ' and ' + end + ' is ' + S[end] + '.');
    }
    
    var path = [];
    let i = end;
    let pathDetectIterations = 0;
    while (P[i] !== 0) {
      path.push(this.createEdge(P[i],i));
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
    
    return S;
  }

}

module.exports = TransitGraph;

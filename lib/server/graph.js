'use strict';

var Edge = require('./edge.js');

class TransitGraph {
  
  //-------------------------------------------------
  constructor(edgeList, numNodes, stops) {
    this.edgeList = edgeList;
    this.numNodes = numNodes;
    this.stops = stops;
    this.G = this.toGraph();
  }
  
  //-------------------------------------------------
  length() {
    return this.G.length;
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
}

module.exports = TransitGraph;

'use strict';

var EventEmitter = require('events').EventEmitter;

class Graph extends EventEmitter {
  constructor(in_edge_list, in_num_nodes) {
    super();
    if (in_edge_list === undefined || in_num_nodes === undefined) {
      throw 'bad';
    }
    if (in_edge_list && in_num_nodes) {
      this.edgeList = in_edge_list;
      this.numNodes = in_num_nodes;
      var self = this;
      this.G = this.toGraph();
    }
  }

  toGraph() {
    var graph = [];
  
    for (var i = 0; i < this.numNodes; i++) {
      graph.push([]);
      for (var j = 0; j < this.numNodes; j++) {
        graph[i][j] = 0;
      }
    }
    
    for (var edgeIndex in this.edgeList) {
      graph[this.edgeList[edgeIndex][0]][this.edgeList[edgeIndex][1]] = 1;
    }
    return graph;
  }

  getArray() {
    return this.toGraph();
  }
}

class TransitGraph extends Graph {
  constructor(edgeList, numNodes, stops) {
    super(edgeList, numNodes);
    this.stops = stops;
  }
  
  edgesAsGeoJson() {
    var edgesGeoJson = [];
    
    for (var edgeIndex in this.edgeList) {
      var originNode = this.stops[this.edgeList[edgeIndex][0]];
      var destNode = this.stops[this.edgeList[edgeIndex][1]];
      
      edgesGeoJson.push({
        'type': 'Feature',
        'geometry': {
          'type': 'LineString',
          'coordinates': [
              [ originNode.stop_lon, originNode.stop_lat ],
              [ destNode.stop_lon, destNode.stop_lat ]
            ]
        }
      });
    }
    edgesGeoJson = {
      'type': 'FeatureCollection',
      'features': edgesGeoJson
    };
    
    return edgesGeoJson;
  }

  stopsAsGeoJson() {
    var stopsGeoJson = [];
    
    for (var stopIndex in this.stops) {
      stopsGeoJson.push({
        'type': 'Feature',
        'properties': {
          'id': stopIndex,
          'name': this.stops[stopIndex].stop_name
        },
        'geometry': {
          'type': 'Point',
          'coordinates': [this.stops[stopIndex].stop_lon, this.stops[stopIndex].stop_lat]
        }
      });
    }
    stopsGeoJson = {
      'type': 'FeatureCollection',
      'features': stopsGeoJson
    };
    
    return stopsGeoJson;
  }
}

module.exports = { Graph: Graph, TransitGraph: TransitGraph };

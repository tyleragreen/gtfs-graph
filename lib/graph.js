'use strict';

var EventEmitter = require('events').EventEmitter;
var graphMsg = require('./graphConstants.js');

class Graph extends EventEmitter {
  constructor(in_edge_list, in_num_nodes, stops) {
    super();
    if (in_edge_list && in_num_nodes) {
      this.edgeList = in_edge_list;
      this.numNodes = in_num_nodes;
      this.stops = stops;
      var self = this;
      this.G = this.toGraph();
  
      this.D = [];
      for (var i = 0; i < this.numNodes; i++) this.D.push(false);
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

  edgesAsGeoJson(nodes) {
    var edgesGeoJson = [];
    
    for (var edgeIndex in this.edgeList) {
      var originNode = nodes[this.edgeList[edgeIndex][0]];
      var destNode = nodes[this.edgeList[edgeIndex][1]];
      
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

  dfs(node, parent) {
    this.D[node] = true;
    this.emit(graphMsg.visit, [ this.stops[node], this.stops[parent] || this.stops[node] ]);
    for (var i = 0; i < this.G[node].length; i++) {
      if (this.G[node][i] === 1) {
        if (this.D[i] === false) {
          this.dfs(i, node);
        }
      }
    }
    this.D[node] = false;
    this.emit(graphMsg.leave, [ this.stops[node], this.stops[parent] || this.stops[node] ])
  }
}

module.exports = Graph;

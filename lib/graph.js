'use strict';

var dfs = require('./traversals.js').dfs;
var BasicTraverser = require('./graphTraverser.js').BasicTraverser;

class Graph {
  constructor(in_edge_list, in_num_nodes) {
    if (in_edge_list && in_num_nodes) {
      this.edgeList = in_edge_list;
      this.numNodes = in_num_nodes;
      this.G = this.toGraph();
    }
  }

  toGraph() {
    const graph = [];
  
    for (let i = 0; i < this.numNodes; i++) {
      graph.push([]);
      for (let j = 0; j < this.numNodes; j++) {
        graph[i][j] = 0;
      }
    }
    
    for (let edgeIndex in this.edgeList) {
      let edge = this.edgeList[edgeIndex];
      graph[edge[0]][edge[1]] = 1;
    }
    return graph;
  }
  
  getEdgeList() {
    return this.edgeList;
  }

  getArray() {
    return this.toGraph();
  }
}

class TransitGraph extends Graph {
  constructor(edgeList, numNodes, stops) {
    let untypedEdgeList = edgeList.map(edge => edge.edge);
    let transferEdges = edgeList.filter(edge => edge.type == 'transfer');
    let routeEdges = edgeList.filter(edge => edge.type == 'route');
    super(untypedEdgeList, numNodes);
    this.typedEdgeList = edgeList;
    this.stops = stops;
    var G = super.toGraph();//var parent = super;
    
    // Create simplified graph for use with page rank
    // 1) Create graph from transfer edges
    // 2) Run DFS on the transfer edge graph, storing away the unique edges one can reach
    // 3) Create a new graph that ORs together the each result from step 2
    const transferGraph = new Graph(transferEdges.map(edge => edge.edge), numNodes);
    let seenNodes = [];
    let nodeGroupings = [];
    for (let node=0; node < transferGraph.G.length; node++) {
      if (seenNodes.indexOf(node) === -1) {
        let traverser = new BasicTraverser();
        dfs(transferGraph, traverser, node);
        nodeGroupings.push(traverser.visitedNodes);
        traverser.visitedNodes.forEach((node) => seenNodes.push(node));
      }
    }
    let newGraph = [];
    nodeGroupings.forEach(function(nodeGrouping) {
      var nodeConnections;
      if (nodeGrouping.length === 1) {
        nodeConnections = G[nodeGrouping[0]];
      } else {
        for (var nodeConnections = []; nodeConnections.length < G.length; nodeConnections.push(0));
        
        // Iterate over all nodes in the new supernode
        for (let groupIndex = 0; groupIndex < nodeGrouping.length; groupIndex++) {
          // Iterate over each possible outgoing edge for the new supernode
          for (let j = 0; j < G.length; j++) {
            if (nodeConnections[j] || nodeGrouping[groupIndex][j]) {
              nodeConnections[j] = 1;
            }
          }
        }
      }
      newGraph.push(nodeConnections);
    });
    let superGraph = new Graph();
    superGraph.G = newGraph; 
  }
  
  edgesAsGeoJsonFeatures() {
    const edgesGeoJson = [];
    
    for (let edgeIndex in this.typedEdgeList) {
      let edge = this.typedEdgeList[edgeIndex].edge;
      let originNode = this.stops[edge[0]];
      let destNode = this.stops[edge[1]];
      
      edgesGeoJson.push({
        'type': 'Feature',
        'properties': {
          'edgeType': this.typedEdgeList[edgeIndex].type
        },
        'geometry': {
          'type': 'LineString',
          'coordinates': [
              [ originNode.stop_lon, originNode.stop_lat ],
              [ destNode.stop_lon, destNode.stop_lat ]
            ]
        }
      });
    }
    return {
      'type': 'FeatureCollection',
      'features': edgesGeoJson
    }
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

'use strict';

var dfs = require('./traversals.js').dfs;
var BasicTraverser = require('./graphTraverser.js').BasicTraverser;
var logger = require('./logger.js');

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
        if (j >= i) {
          //graph[i][j] = null;
        } else {
          graph[i][j] = 0;
        }
      }
    }
    
    for (let edgeIndex in this.edgeList) {
      let edge = this.edgeList[edgeIndex];
      let max = Math.max(edge[0],edge[1]);
      let min = Math.min(edge[0],edge[1]);
      graph[max][min] = 1;
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
    super(untypedEdgeList, numNodes);
    this.typedEdgeList = edgeList;
    this.transferEdges = edgeList.filter(edge => edge.type == 'transfer');
    this.stops = stops;
  }
  
  mergeTransferNodes() {
    var that = this;
    // Create simplified graph for use with page rank
    // 1) Create graph from transfer edges
    // 2) Run DFS on the transfer edge graph, storing away the unique edges one can reach
    // 3) Create a new graph that ORs together the each result from step 2
    const transferGraph = new Graph(this.transferEdges.map(edge => edge.edge), this.numNodes);
    let seenNodes = [];
    let nodeGroupings = [];
    let G = super.toGraph();//var parent = super;
    for (let node=0; node < transferGraph.G.length; node++) {
      if (seenNodes.indexOf(node) === -1) {
        let traverser = new BasicTraverser();
        dfs(transferGraph, traverser, node);
        nodeGroupings.push(traverser.visitedNodes);
        traverser.visitedNodes.forEach((node) => seenNodes.push(node));
      }
    }
    // Remove the node groupings that only contain a single node.
    // This meant there were no transfers connecting this node with another one.
    let nodesToMerge = nodeGroupings.filter(e => e.length > 1);
    var newGraph = [];
    // Create a copy of the graph so we can merge nodes out of it
    //console.log('old graph', G);
    G.forEach(function(rowOfNodes) {
      newGraph.push(rowOfNodes.slice());
    });
    var newStops = this.stops.slice();
    //newGraph[0].shift();
    //console.log('old graph', G);
    //console.log('new graph', newGraph);
    //console.log('index 0', G[0].length);
    //console.log('new index 0', newGraph[0].length);
    ////nodesToMerge.forEach()
    //console.log('node groupings', nodeGroupings);
    //console.log('nodes to merge', nodesToMerge);
    
    mergeTop(nodesToMerge[0][0], nodesToMerge[0][1]);
    
    function mergeTop(indexA, indexB) {
      if (indexA < indexB) {
        return merge(indexA, indexB);
      } else {
        return merge(indexB, indexA);
      }
    }
    
    function mergeEdges(edgeA, edgeB) {
      if (edgeA + edgeB === 0) {
        return 0;
      } else if (edgeA + edgeB > 0) {
        return 1;
      } else {
        throw 'bad edge merge case';
      }
    }
    
    function merge(loIndex, hiIndex) {
      console.log('merging ' + that.stops[loIndex].stop_name + ' with ' + that.stops[hiIndex].stop_name);
      that.stops.push({ 'stop_name': that.stops[loIndex].stop_name + ' / ' + that.stops[hiIndex].stop_name });
      that.stops.splice(loIndex,1);
      that.stops.splice(hiIndex-1,1);
      console.log(that.stops);
      
      // Add a row to the new graph to represent the union
      //console.log('new graph length', newGraph.length);
      for (var newRow = []; newRow.length < newGraph.length - 1; newRow.push(0));
      newGraph.push(newRow);
      //console.log('new graph', newGraph);
      let unionIndex = newGraph.length - 1;
      
      horizontalOverlap(loIndex, hiIndex, unionIndex);
      //console.log('after 1');
      //console.log(newGraph);
      horizontalHiOvershoot(loIndex, hiIndex, unionIndex);
      //console.log('after 2');
      //console.log(newGraph);
      verticalOverlap(loIndex, hiIndex, unionIndex);
      //console.log('after 3');
      //console.log(newGraph);
      verticalLoOvershoot(loIndex, hiIndex, unionIndex);
      //console.log('lo index', loIndex);
      //console.log('hi index', hiIndex);
      newGraph[unionIndex].splice(loIndex,1);
      newGraph[unionIndex].splice(hiIndex-1,1);
      newGraph.splice(loIndex,1);
      // We need to subtract one since the array is no one shorter
      newGraph.splice(hiIndex-1,1);
      
      for (let i = 0; i < newGraph.length - 1; i++) {
        newGraph[i].splice(newGraph[i].indexOf(null),1);
        newGraph[i].splice(newGraph[i].indexOf(null),1);
      }
    }
    function horizontalOverlap(loIndex, hiIndex, unionIndex) {
      let loLows = newGraph[loIndex];
      let hiLows = newGraph[hiIndex];
      let unionLows = newGraph[unionIndex];
      //console.log('lo lows', loLows);
      //console.log('hi lows', hiLows);
      for (let i = 0; i < loIndex; i++) {
        unionLows[i] = mergeEdges(loLows[i], hiLows[i]);
        newGraph[loIndex][i] = null;
      }
    }
    function horizontalHiOvershoot(loIndex, hiIndex, unionIndex) {
      let hiLows = newGraph[hiIndex];
      let unionLows = newGraph[unionIndex];
      
      for (let i = loIndex + 1; i < hiIndex; i++) {
        unionLows[i] = mergeEdges(hiLows[i], 0);
      }
      for (let i = 0; i < hiIndex; i++) {
        newGraph[hiIndex][i] = null;
      }
    }
    function verticalOverlap(loIndex, hiIndex, unionIndex) {
      let unionLows = newGraph[unionIndex];
      
      for (let i = hiIndex + 1; i < unionIndex; i++) {
        let subGraph = newGraph[i];
        unionLows[i] = mergeEdges(subGraph[loIndex], subGraph[hiIndex]);
     //   console.log('i',i);
        subGraph[loIndex] = null;
        subGraph[hiIndex] = null;
      }
    }
    function verticalLoOvershoot(loIndex, hiIndex, unionIndex) {
      let unionLows = newGraph[unionIndex];
      
      for (let i = loIndex + 1; i < hiIndex; i++) {
        let overlap = newGraph[i][loIndex];
        
        if (overlap !== 0) {
          unionLows[i] = mergeEdges(overlap, unionLows[i]);
          newGraph[i][loIndex] = null;
        }
      }
    }
    //this.mergeGraph = new TransitGraph({ graph: newGraph, stops: });
    return newGraph;
    //console.log('end result');
    //console.log(newGraph);
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
    };
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

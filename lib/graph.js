'use strict';

var dfs = require('./traversals.js').dfs;
var BasicTraverser = require('./graphTraverser.js').BasicTraverser;
var logger = require('./logger.js');

var mergeTransferNodes = function(graph) {
  while (graph.transferEdgeList.length > 0) {
    // Create simplified graph for use with page rank
    // 1) Create graph from transfer edges
    // 2) Run DFS on the transfer edge graph, storing away the unique edges one can reach
    // 3) Create a new graph that ORs together the each result from step 2
    console.log('transfer edge list', graph.transferEdgeList);
    const transferGraph = new TransitGraph(graph.transferEdgeList, graph.numNodes, graph.stops);
    console.log('transfer graph', transferGraph);
    console.log('deeeeep', transferGraph.edgeList);
    let seenNodes = [];
    let nodeGroupings = [];
    for (let node=0; node < transferGraph.G.length; node++) {
      if (seenNodes.indexOf(node) === -1) {
        let traverser = new BasicTraverser();
        dfs(transferGraph, traverser, node);
        console.log('visited',traverser.visitedNodes);
        nodeGroupings.push(traverser.visitedNodes);
        traverser.visitedNodes.forEach((node) => seenNodes.push(node));
      }
    }
    // Remove the node groupings that only contain a single node.
    // This meant there were no transfers connecting this node with another one.
    console.log('groupings', nodeGroupings);
    let nodesToMerge = nodeGroupings.filter(e => e.length > 1);
    var newGraph = [];
    // Create a copy of the graph so we can merge nodes out of it
    graph.G.forEach(function(rowOfNodes) {
      newGraph.push(rowOfNodes.slice());
    });
    var newStops = graph.stops.slice();
    
    mergeTop(nodesToMerge[0][0], nodesToMerge[0][1]);
    let newNumNodes = graph.numNodes - 1;
    let newEdgeList = [];
    
    for (let i = 0; i < newGraph.length; i++) {
      for (let j = 0; j < newGraph.length; j++) {
        if (j >= i) {
        } else {
          console.log('node', newGraph[i][j]);
          if (newGraph[i][j] !== 0) {
            newEdgeList.push({ type: newGraph[i][j].type, edge: [i,j] });
          }
        }
      }
    }
    console.log('new edge list', newEdgeList);
    
    graph = new TransitGraph(newEdgeList, newNumNodes, newStops);
  }
  
  return graph;
  
    function mergeTop(indexA, indexB) {
      if (indexA < indexB) {
        merge(indexA, indexB);
      } else {
        merge(indexB, indexA);
      }
    }
    
    function mergeEdges(edgeA, edgeB) {
      console.log('edgeA', edgeA);
      console.log('edgeB', edgeB);
      if (edgeA === 0 && edgeB === 0) {
        return 0;
      } else if (edgeA.type === 'transfer' || edgeB.type === 'transfer') {
        return { type: 'transfer'};
      } else {
        return { type: 'route' };
      }
    }
    
    function merge(loIndex, hiIndex) {
      console.log('merging ' + newStops[loIndex].stop_name + ' with ' + newStops[hiIndex].stop_name);
      newStops.push({ 'stop_name': newStops[loIndex].stop_name + ' / ' + newStops[hiIndex].stop_name });
      newStops.splice(loIndex,1);
      newStops.splice(hiIndex-1,1);
      
      // Add a row to the new graph to represent the union
      //console.log('new graph length', newGraph.length);
      for (var newRow = []; newRow.length < newGraph.length - 1; newRow.push(0));
      newGraph.push(newRow);
      
      let unionIndex = newGraph.length - 1;
      
      horizontalOverlap(loIndex, hiIndex, unionIndex);
      console.log('after1',newGraph);
      horizontalHiOvershoot(loIndex, hiIndex, unionIndex);
      console.log('after2',newGraph);
      verticalOverlap(loIndex, hiIndex, unionIndex);
      console.log('after3',newGraph);
      verticalLoOvershoot(loIndex, hiIndex, unionIndex);
      console.log('after4',newGraph);
      
      newGraph[unionIndex].splice(loIndex,1);
      newGraph[unionIndex].splice(hiIndex-1,1);
      newGraph.splice(loIndex,1);
      // We need to subtract one since the array is no one shorter
      newGraph.splice(hiIndex-1,1);
      
      //var aCount = new Map([...new Set(a)].map(
      //  x => [x, a.filter(y => y === x).length]
      //));
      
      console.log('after5',newGraph);
      for (let i = 0; i < newGraph.length - 1; i++) {
        while (newGraph[i].indexOf(null) !== -1) {
          newGraph[i].splice(newGraph[i].indexOf(null),1);
        }
      }
      console.log('after6',newGraph);
    }
    
    function horizontalOverlap(loIndex, hiIndex, unionIndex) {
      let loLows = newGraph[loIndex];
      let hiLows = newGraph[hiIndex];
      let unionLows = newGraph[unionIndex];
      
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
};

class TransitGraph {
  constructor(in_edge_list, in_num_nodes, in_stops) {
    this.numNodes = in_num_nodes;
    this.edgeList = in_edge_list;
    this.stops = in_stops;
    this.G = this.toGraph();
    this.transferEdgeList = this.edgeList.filter(edge => edge.type === 'transfer');
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
      let edge = this.edgeList[edgeIndex].edge;
      let max = Math.max(edge[0],edge[1]);
      let min = Math.min(edge[0],edge[1]);
      graph[max][min] = { type: this.edgeList[edgeIndex].type };
    }
    return graph;
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

module.exports = { TransitGraph: TransitGraph, mergeTransferNodes: mergeTransferNodes };

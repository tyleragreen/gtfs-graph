'use strict';

var async = require('async');
var logger = require('./logger.js');
var TransitGraph = require('./graph.js');
var BasicTraverser = require('../lib/graphTraverser.js').BasicTraverser;

var dfs = function(graph, traverser, node) {
  for (var D = []; D.length < graph.numNodes; D.push(false));
  
  var dfsExplore = function(graph, traverser, node, parent) {
    D[node] = true;
    
    if (traverser && parent) { traverser.visit(parent, node); }
    if (traverser) traverser.visitNode(node);
    
    for (let i = 0; i < graph.G.length; i++) {
      if (i < node && graph.G[node][i] !== 0 && !D[i]) {
        dfsExplore(graph, traverser, i, node);
      } else if (i > node && graph.G[i][node] !== 0 && !D[i]) {
        dfsExplore(graph, traverser, i, node);
      }
      // don't do anything in the i==node case
      // #TheDiagonal
    }
    
    if (traverser && parent) { traverser.leave(node, parent); }
  };
  
  dfsExplore(graph, traverser, node);
};

var bfs = function(graph, traverser, s, callback) {
  let Q = [];
  for (var D = []; D.length < graph.numNodes; D.push(false));
  
  Q.push(s);
  D[s] = true;
  
  async.whilst(
    function() { return Q.length > 0; },
    function(callback) {
      let node = Q.shift();
      
      for (var i = 0; i < graph.G.length; i++) {
        if (i < node && graph.G[node][i] !== 0 && !D[i]) {
          Q.push(i);
          D[i] = true;
          
          if (traverser) { traverser.visit(node, i); }
        } else if (i > node && graph.G[i][node] !== 0 && !D[i]) {
          Q.push(i);
          D[i] = true;
          
          if (traverser) { traverser.visit(node, i); }
        }
        // don't do anything in the i==node case
        // #TheDiagonal
      }
      setImmediate(function() {
        callback(null, Q);
      });
    },
    function (err, n) {
      if (err) throw err;
      
      logger.info('bfs done');
      
      if (callback) { callback(); }
    }
  );
};

var pageRank = function(graph) {
  const mergedGraph = mergeTransferNodes(graph);
  const outgoingEdgeCounts = [];
  let incomingNodes;
  let ranks;
  const damping = 0.85;
  let iterations = 10;
  const initialRank = 1.0;

  for (ranks = []; ranks.length < mergedGraph.G.length; ranks.push(initialRank));
  for (incomingNodes = []; incomingNodes.length < mergedGraph.G.length; incomingNodes.push([]));
  
  function countOutgoingEdges() {
    for (let i = 0; i < mergedGraph.numNodes; i++) {
      var edgeCount = 0;
      for (let j = 0; j < mergedGraph.numNodes; j++) {
        if (j < i && mergedGraph.G[i][j] !== 0) {
          edgeCount += 1;
        } else if (j > i && mergedGraph.G[j][i] !== 0) {
          edgeCount += 1;
        }
      }
      outgoingEdgeCounts.push(edgeCount);
    }
  }
  
  function countIncomingEdges() {
    for (let i = 0; i < mergedGraph.numNodes; i++) {
      for (let j = 0; j < mergedGraph.numNodes; j++) {
        if (j < i && mergedGraph.G[i][j] !== 0) {
          incomingNodes[j].push(i);
        } else if (j > i && mergedGraph.G[j][i] !== 0) {
          incomingNodes[j].push(i);
        }
      }
    }
  }
  
  function updateRank(nodeIndex) {
    var inNodeSummation = 0;
  
    incomingNodes[nodeIndex].forEach(function(incoming, index) {
      inNodeSummation += (ranks[incoming] / outgoingEdgeCounts[incoming]);
    });
    
    return ((1 - damping) / mergedGraph.G.length) + (damping * inNodeSummation);
  }
  
  countOutgoingEdges();
  countIncomingEdges();
  
  while (iterations--) {
    for (let node = 0; node < ranks.length; node++) {
      ranks[node] = updateRank(node);
    }
  }
  
  ranks.forEach(function(rank, node) {
    logger.info("Rank of node " + node + " (" + mergedGraph.stops[node].stop_name + ") is " + rank);
  });
};

var mergeTransferNodes = function(graph) {
  while (graph.transferEdgeList.length > 0) {
    // Create simplified graph for use with page rank
    // 1) Create graph from transfer edges
    // 2) Run DFS on the transfer edge graph, storing away the unique edges one can reach
    // 3) Create a new graph that ORs together the each result from step 2
    const transferGraph = new TransitGraph(graph.transferEdgeList, graph.numNodes, graph.stops);
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
    // Remove the node groupings that only contain a single node.
    // This meant there were no transfers connecting this node with another one.
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
        if (j < i) {
          if (newGraph[i][j] !== 0) {
            newEdgeList.push({ type: newGraph[i][j].type, edge: [i,j] });
          }
        }
      }
    }
    
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
    if (edgeA === 0 && edgeB === 0) {
      return 0;
    } else if (edgeA.type === 'transfer' || edgeB.type === 'transfer') {
      return { type: 'transfer'};
    } else {
      return { type: 'route' };
    }
  }
  
  function merge(loIndex, hiIndex) {
    newStops.push({ 'stop_name': newStops[loIndex].stop_name + ' / ' + newStops[hiIndex].stop_name });
    newStops.splice(loIndex,1);
    newStops.splice(hiIndex-1,1);
    
    // Add a row to the new graph to represent the union
    for (var newRow = []; newRow.length < newGraph.length - 1; newRow.push(0));
    newGraph.push(newRow);
    
    let unionIndex = newGraph.length - 1;
    
    horizontalOverlap(loIndex, hiIndex, unionIndex);
    horizontalHiOvershoot(loIndex, hiIndex, unionIndex);
    verticalOverlap(loIndex, hiIndex, unionIndex);
    verticalLoOvershoot(loIndex, hiIndex, unionIndex);
    
    newGraph[unionIndex].splice(loIndex,1);
    newGraph[unionIndex].splice(hiIndex-1,1);
    newGraph.splice(loIndex,1);
    // We need to subtract one since the array is no one shorter
    newGraph.splice(hiIndex-1,1);
    
    for (let i = 0; i < newGraph.length - 1; i++) {
      while (newGraph[i].indexOf(null) !== -1) {
        newGraph[i].splice(newGraph[i].indexOf(null),1);
      }
    }
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

module.exports = { dfs: dfs, bfs: bfs, pageRank: pageRank, mergeTransferNodes: mergeTransferNodes };


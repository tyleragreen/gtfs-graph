'use strict';

var async = require('async');
var logger = require('./logger.js');

var dfs = function(graph, traverser, node) {
  for (var D = []; D.length < graph.numNodes; D.push(false));
  
  var dfsExplore = function(graph, traverser, node, parent) {
    D[node] = true;
    
    if (traverser && parent) { traverser.visit(parent, node); }
    if (traverser) traverser.visitNode(node);
    
    for (let i = 0; i < graph.G[node].length; i++) {
      if (graph.G[node][i] === 1 && !D[i]) {
        dfsExplore(graph, traverser, i, node);
      }
    }
    
    if (traverser && parent) { traverser.leave(node, parent); }
  };
  
  dfsExplore(graph, traverser, node);
};

var bfs = function(graph, traverser, s) {
  let Q = [];
  Q.push(s);
  
  for (var D = []; D.length < graph.numNodes; D.push(false));
  
  async.whilst(
    function() { return Q.length > 0; },
    function(callback) {
      let node = Q.shift();
      
      for (var i = 0; i < graph.G[node].length; i++) {
        if (graph.G[node][i] === 1 && !D[i]) {
          Q.push(i);
          D[i] = true;
          
          if (traverser) { traverser.visit(node, i); }
        }
      }
      setImmediate(function() {
        callback(null, Q);
      });
    },
    function (err, n) {
      if (err) throw err;
      
      logger.info('bfs done');
    }
  );
};

var pageRank = function(graph) {
  const G = graph.G;
  const outgoingEdgeCounts = [];
  let incomingNodes;
  let ranks;
  const damping = 0.85;
  let iterations = 10;
  const initialRank = 1.0;

  for (ranks = []; ranks.length < G.length; ranks.push(initialRank));
  for (incomingNodes = []; incomingNodes.length < G.length; incomingNodes.push([]));
  
  function countOutgoingEdges() {
    for (let i=0; i < G.length; i++) {
      let edges = G[i].reduce((a, b) => a + b, 0);
      outgoingEdgeCounts.push(edges);
    }
  }
  
  function countIncomingEdges() {
    for (let i = 0; i < G.length; i++) {
      for (let j = 0; j < G.length; j++) {
        if (G[i][j]) {
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
    
    return ((1 - damping) / G.length) + (damping * inNodeSummation);
  }
  
  countOutgoingEdges();
  countIncomingEdges();
  
  while (iterations--) {
    for (let node = 0; node < ranks.length; node++) {
      ranks[node] = updateRank(node);
    }
  }
  
  //ranks.forEach(function(rank, node) {
  //  console.log("Rank of node "+ node + " is " + rank);
  //})
};

module.exports = { dfs: dfs, bfs: bfs, pageRank: pageRank };

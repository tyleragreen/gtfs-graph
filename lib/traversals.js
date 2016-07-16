'use strict';

var async = require('async');
var logger = require('./logger.js');

var dfs = function(graph, traverser, node, parent) {
  let D = [];
  for (var i = 0; i < graph.numNodes; i++) D.push(false);
  
  var dfs_recurse = function(graph, traverser, node, parent) {
    D[node] = true;
    
    if (traverser && parent) { traverser.visit(parent, node); }
    
    for (var i = 0; i < graph.G[node].length; i++) {
      // If the edge between the current node and the next node exists, and we
      // have not yet visited the next node, onwards traverse!
      if (graph.G[node][i] === 1 && !D[i]) {
        dfs_recurse(graph, traverser, i, node)
      }
    }
    
    if (traverser && parent) { traverser.leave(node, parent); }
  };
  
  dfs_recurse(graph, traverser, node, parent);
};

var bfs = function(graph, traverser, s) {
  let Q = [];
  Q.push(s);
  
  let D = [];
  for (var i = 0; i < graph.numNodes; i++) D.push(false);
  
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
  var damping = 0.85,
	iterations = 7;
  var initialRank = 1.0;

  var ranks = filledArray (G.length, initialRank);
  function filledArray (length, value) {
	  return Array.apply (null, Array (length)).map (Number.prototype.valueOf, value);
  }
  for (incomingNodes = []; incomingNodes.length < G.length; incomingNodes.push (filledArray (G.length, -1)));
  //console.log('incoming',incomingNodes);
  function outgoingEdgeCount() {
    //console.log('graph', G);
    function add(a, b) {
      return a + b;
    }
    for (var i=0; i < G.length; i++) {
      var edges = G[i].reduce(add, 0);
      outgoingEdgeCounts.push(edges);
      //console.log('edges', G[i], edges);
    }
    //console.log('outgoings', outgoingEdgeCounts);
  }
  
  function incomingEdgeCount() {
    for (var i = 0; i < G.length; i++) {
	  	for (var j = 0; j < G.length; j++) {
	  		if (G [i] [j]) {
	  			var nextPos = incomingNodes [j].indexOf (-1);
	  			incomingNodes [j] [nextPos] = i;
	  		}
	  	}
	  }
	  
	  incomingNodes.forEach (function (arr) {
		  arr.splice (arr.indexOf (-1));
	  });
	  
   // console.log('incoming',incomingNodes);
  }
  outgoingEdgeCount();
  incomingEdgeCount();
  
  function updateRank(nodeIndex) {
  	var inNodeSummation = 0, result;
  
  	incomingNodes [nodeIndex].forEach (function (incoming, i) {
  		inNodeSummation += (ranks[incoming] / outgoingEdgeCounts[incoming]);
  	});
  	
  	result = ((1 - damping) / G.length) + (damping * inNodeSummation);		//notice the subtle difference between equations of Basic PR & PR version 2 (divide by N)
  	return result;
  }
  
  while (iterations--) {
  	for (var node = 0; node < ranks.length; node++) {
  		ranks [node] = updateRank(node);
  	}
  }
  
  ranks.forEach (function (rank, node) {
  	logger.info('Rank of Node #' + node + ' ('+ graph.stops[node].stop_name + ') = ' + rank);
  });
};

module.exports = { dfs: dfs, bfs: bfs, pageRank: pageRank };
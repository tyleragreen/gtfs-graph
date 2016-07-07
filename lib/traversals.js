'use strict';

var dfs = function(graph, traverser, node, parent) {
  let D = [];
  for (var i = 0; i < graph.numNodes; i++) D.push(false);
  
  var dfs_recurse = function(graph, traverser, node, parent) {
    D[node] = true;
    
    if (traverser && parent) { traverser.visit(node, parent); }
    
    for (var i = 0; i < graph.G[node].length; i++) {
      if (graph.G[node][i] === 1) {
        if (!D[i]) {
          dfs_recurse(graph, traverser, i, node);
        }
      }
    }
    
    if (traverser && parent) { traverser.leave(node, parent); }
  };
  
  dfs_recurse(graph, traverser, node, parent);
};

var bfs = function(graph, traverser, s) {
  let Q = [];
  
  Q.push(s);
  
  while (Q.length > 0) {
    console.log('length', Q.length);
    let node = Q.shift();
    for (var i = 0; i < graph.G[node].length; i++) {
      process.nextTick(function() {
        console.log('did tick ever happen');
        if (graph.G[node][i] === 1) {
          Q.push(i);
          console.log('node ' + i);
          
          if (traverser) { traverser.visit(node, i); }
        }
      });
    }
  }
};

module.exports = { dfs: dfs, bfs: bfs };
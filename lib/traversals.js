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

module.exports = { dfs: dfs };
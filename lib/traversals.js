'use strict';

var async = require('async');
//import whilst from 'async/whilst';

var socketMsg = require('../public/js/constants.js');

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

var bfs = function(socket, graph, traverser, s) {
  let Q = [];
  Q.push(s);
  
  let D = [];
  for (var i = 0; i < graph.numNodes; i++) D.push(false);
  
  async.whilst(
    function() { return Q.length > 0; },
    function(callback) {
      let node = Q.shift();
      D[node] = true;
      
      for (var i = 0; i < graph.G[node].length; i++) {
        if (!D[i]) {
          if (graph.G[node][i] === 1) {
            Q.push(i);
            
            if (traverser) { traverser.visit(node, i); }
          }
        }
      }
      setImmediate(function() {
        callback(null, Q);
      });
    },
    function (err, n) {
      console.log('bfs done');
    }
  );
};

module.exports = { dfs: dfs, bfs: bfs };
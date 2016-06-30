'use strict';

var Graph = require('../lib/graph.js').Graph;
var dfs = require('../lib/traversals.js').dfs;
var expect = require('chai').expect;

describe('The graph', function() {
  it('should be successfully created from a list of edges', function() {
    var numNodes = 5;
    var edgeList = [
        [ 1, 2], [ 2, 4]
      ];
    var expectedGraph = [
        [ 0, 0, 0, 0, 0 ],
        [ 0, 0, 1, 0, 0 ],
        [ 0, 0, 0, 0, 1 ],
        [ 0, 0, 0, 0, 0 ],
        [ 0, 0, 0, 0, 0 ],
      ];
    var graph = new Graph(edgeList, numNodes);
    dfs(graph, null, 2);
    
    expect(graph.getArray()).to.deep.equal(expectedGraph);
  });
});

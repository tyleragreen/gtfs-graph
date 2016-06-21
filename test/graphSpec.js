'use strict';

var Graph = require('../lib/graph.js');
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
    expect(graph.getArray()).to.deep.equal(expectedGraph);
  });
});

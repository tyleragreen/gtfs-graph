'use strict';

var Graph = require('../lib/graph.js');

describe('The graph', function() {
  it('should be successfully created from a list of edges', function(done) {
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
    expect(graph.toGraph()).toEqual(expectedGraph);
    done();
  });
});

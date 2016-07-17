'use strict';

process.env.NODE_ENV = 'test';

var Graph = require('../lib/graph.js').Graph;
var TransitGraph = require('../lib/graph.js').TransitGraph;
var BasicTraverser = require('../lib/graphTraverser.js').BasicTraverser;
var traversals = require('../lib/traversals.js');

var expect = require('chai').expect;

describe('The graph', function() {
  before(function() {
    let numNodes = 5;
    let edgeList = [
        [ 1, 2], [ 2, 4], [ 1, 4]
      ];
    this.expectedGraph = [
        [ 0, 0, 0, 0, 0 ],
        [ 0, 0, 1, 0, 1 ],
        [ 0, 0, 0, 0, 1 ],
        [ 0, 0, 0, 0, 0 ],
        [ 0, 0, 0, 0, 0 ],
      ];
    this.graph = new Graph(edgeList, numNodes);
  })
  
  it('should be successfully created from a list of edges', function() {
    expect(this.graph.getArray()).to.deep.equal(this.expectedGraph);
  });
  
  it('can be traversed by dfs search', function() {
    let startingNode = 1;
    let graphTraverser = new BasicTraverser();
    traversals.dfs(this.graph, graphTraverser, startingNode);
    
    expect(graphTraverser.visitedEdges.length).to.equal(2);
    expect(graphTraverser.visitedEdges).to.deep.equal([[1,2],[2,4]]);
    expect(graphTraverser.leftEdges.length).to.equal(2);
    expect(graphTraverser.leftEdges).to.deep.equal([[4,2],[2,1]]);
    expect(graphTraverser.visitedNodes).to.deep.equal([1,2,4]);
  });
  
  it('can be traversed by bfs search', function() {
    let startingNode = 1;
    var graphTraverser = new BasicTraverser();
    traversals.bfs(this.graph, graphTraverser, startingNode);
    
    expect(graphTraverser.visitedEdges.length).to.equal(2);
    expect(graphTraverser.visitedEdges).to.deep.equal([[1,2],[1,4]]);
    expect(graphTraverser.leftEdges.length).to.equal(0);
    expect(graphTraverser.leftEdges).to.deep.equal([]);
  });
  
  it('can be ranked with Page Rank', function() {
    traversals.pageRank(this.graph);
  });
});

describe('A transit graph', function() {
});

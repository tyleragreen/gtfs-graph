'use strict';

process.env.NODE_ENV = 'test';

var Graph = require('../lib/graph.js').Graph;
var TransitGraph = require('../lib/graph.js').TransitGraph;
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
    let visitedEdges = [];
    let leftEdges = [];
    let startingNode = 1;
    var GraphTraverser = function() {};
    GraphTraverser.prototype.visit = function(start, end) { visitedEdges.push([start, end]) };
    GraphTraverser.prototype.leave = function(start, end) { leftEdges.push([start, end])};
    var graphTraverser = new GraphTraverser();
    traversals.dfs(this.graph, graphTraverser, startingNode);
    
    expect(visitedEdges.length).to.equal(2);
    expect(visitedEdges).to.deep.equal([[1,2],[2,4]]);
    expect(leftEdges.length).to.equal(2);
    expect(leftEdges).to.deep.equal([[4,2],[2,1]]);
  });
  
  it('can be traversed by bfs search', function() {
    let visitedEdges = [];
    let leftEdges = [];
    let startingNode = 1;
    var GraphTraverser = function() {};
    GraphTraverser.prototype.visit = function(start, end) { visitedEdges.push([start, end]) };
    GraphTraverser.prototype.leave = function(start, end) { leftEdges.push([start, end])};
    var graphTraverser = new GraphTraverser();
    traversals.bfs(this.graph, graphTraverser, startingNode);
    
    expect(visitedEdges.length).to.equal(2);
    expect(visitedEdges).to.deep.equal([[1,2],[1,4]]);
    expect(leftEdges.length).to.equal(0);
    expect(leftEdges).to.deep.equal([]);
  });
  
  it('can be ranked with Page Rank', function() {
    traversals.pageRank(this.graph);
  });
});

describe('A transit graph', function() {
});

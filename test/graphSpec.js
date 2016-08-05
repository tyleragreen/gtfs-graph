'use strict';

process.env.NODE_ENV = 'test';

var TransitGraph = require('../lib/graph.js');
var Stop = require('../lib/stop.js');
var BasicTraverser = require('../lib/graphTraverser.js').BasicTraverser;
//var DijkstraTraverser = require('../lib/graphTraverser.js').DijkstraTraverser;
var traversals = require('../lib/traversals.js');

var expect = require('chai').expect;

describe('A transit graph', function() {
  before(function() {
    let numNodes = 5;
    let edgeList = [
      { type: 'route', edge: [1,0], weight: 2 },
      { type: 'transfer', edge: [2,1], weight: 2 },
      { type: 'route', edge: [4,1], weight: 2 },
      { type: 'route', edge: [3,2], weight: 2 },
      { type: 'route', edge: [4,3], weight: 2 },
      ];
    this.stops = [
      new Stop(0,'A',0,0,['1']),
      new Stop(1,'B',0,0,['1','2']),
      new Stop(2,'C',0,0,['3']),
      new Stop(3,'D',0,0,['3','2']),
      new Stop(4,'E',0,0,['3'])
    ];
    let route = { type: 'route', weight: 2 };
    let routeAfterMerge = { type: 'route', weight: -1 };
    let transfer = { type: 'transfer', weight: 2 };
    this.expectedGraph = [
      [],
      [route],
      [0,transfer],
      [0,0,route],
      [0,route,0,route]
    ];
    this.expectedSuperGraph = [
      [],
      [0],
      [0,route],
      [routeAfterMerge,routeAfterMerge,routeAfterMerge],
    ];
    this.graph = new TransitGraph(edgeList, numNodes, this.stops);
  });
  
  it('can be created', function() {
    expect(this.graph.G).to.deep.equal(this.expectedGraph);
  });
  
  it('can be traversed by dfs search', function() {
    let startingNode = 1;
    let graphTraverser = new BasicTraverser();
    traversals.dfs(this.graph, graphTraverser, startingNode);
    
    expect(graphTraverser.visitedEdges.length).to.equal(4);
    expect(graphTraverser.visitedEdges).to.deep.equal([[1,0],[1,2],[2,3],[3,4]]);
    expect(graphTraverser.leftEdges.length).to.equal(4);
    expect(graphTraverser.leftEdges).to.deep.equal([[0,1],[4,3],[3,2],[2,1]]);
    expect(graphTraverser.visitedNodes).to.deep.equal([1,0,2,3,4]);
  });
  
  it('can be traversed by bfs search', function(done) {
    let startingNode = 1;
    var graphTraverser = new BasicTraverser();
    
    // Perform the assertions inside the callback, as the BFS
    // is an async function.
    traversals.bfs(this.graph, graphTraverser, startingNode, function() {
      expect(graphTraverser.visitedEdges.length).to.equal(4);
      expect(graphTraverser.visitedEdges).to.deep.equal([[1,0],[1,2],[1,4],[2,3]]);
      expect(graphTraverser.leftEdges.length).to.equal(0);
      expect(graphTraverser.leftEdges).to.deep.equal([]);
      done();
    });
  });
  
  it('can have its transfer nodes merged', function() {
    expect(traversals.mergeTransferNodes(this.graph).G).to.deep.equal(this.expectedSuperGraph);
  });
  
  it('can be merged twice', function() {
    let numNodes = 5;
    let edgeList = [
      { type: 'route', edge: [1,0], weight: 2 },
      { type: 'transfer', edge: [2,1], weight: 2 },
      { type: 'route', edge: [4,1], weight: 2 },
      { type: 'transfer', edge: [3,2], weight: 2 },
      { type: 'route', edge: [4,3], weight: 2 },
      ];
    let route = { type: 'route', weight: 2 };
    let routeAfterMerge = { type: 'route', weight: -1 };
    let transfer = { type: 'transfer', weight: 2 };
    this.expectedGraph = [
      [],
      [route],
      [0,transfer],
      [0,0,transfer],
      [0,route,0,route]
    ];
    this.expectedSuperGraph = [
      [],
      [0],
      [routeAfterMerge,routeAfterMerge],
    ];
    this.graph = new TransitGraph(edgeList, numNodes, this.stops);
    expect(traversals.mergeTransferNodes(this.graph).G).to.deep.equal(this.expectedSuperGraph);
  });
  
  it('can be ranked with Page Rank', function() {
    traversals.pageRank(this.graph);
  });
  
  it('can have its shortest path found by Dijkstra\'s algorithm', function() {
    let start = 1;
    let end = 3;
    
    let results = traversals.dijkstra(this.graph,start,end);
    
    expect(results.shortestPathLength).to.equal(4);
    expect(results.shortestPath).to.deep.equal([[1,2],[2,3]]);
  });
});

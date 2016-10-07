'use strict';

process.env.NODE_ENV = 'test';

var TransitGraph = require('../lib/graph/graph.js');
var Stop = require('../lib/graph/stop.js');
var Edge = require('../lib/graph/edge.js');
var BasicTraverser = require('../lib/graph/graphTraverser.js').BasicTraverser;
var traversals = require('../lib/graph/traversals.js');

var expect = require('chai').expect;

function edgesToArrays(edges) {
  return edges.map(edge => {
    return [ edge.origin.id, edge.destination.id ];
  });
}

describe('A transit graph', function() {
  before(function() {
    let numNodes = 5;
    let edgeList = [
      { type: 'route', origin: 1, destination: 0, weight: 2 },
      { type: 'transfer', origin: 2, destination: 1, weight: 2 },
      { type: 'route', origin: 4, destination: 1, weight: 2 },
      { type: 'route', origin: 3, destination: 2, weight: 2 },
      { type: 'route', origin: 4, destination: 3, weight: 2 },
      ];
    this.stops = [
      new Stop(0,'A',0,0,['1']),
      new Stop(1,'B',0,0,['1','2']),
      new Stop(2,'C',0,0,['3']),
      new Stop(3,'D',0,0,['3','2']),
      new Stop(4,'E',0,0,['3'])
    ];
    this.expectedGraph = [
      [],
      [edgeList[0]],
      [null,edgeList[1]],
      [null,null,edgeList[3]],
      [null,edgeList[2],null,edgeList[4]]
    ];
    this.expectedSuperGraph = [
      [],
      [null],
      [null,{type: 'route', weight: 2, origin: 2, destination: 1}],
      [{type: 'route', weight: 2, origin: 3, destination: 0},{type: 'route', weight: 2, origin: 3, destination: 1},{type: 'route', weight: 2, origin: 3, destination: 2}],
    ];
    this.graph = new TransitGraph(edgeList, numNodes, this.stops);
  });
  
  it('can be created', function() {
    expect(this.graph.G.matrix).to.deep.equal(this.expectedGraph);
  });
  
  it('can be traversed by dfs search', function() {
    let startingNode = 1;
    let graphTraverser = new BasicTraverser();
    traversals.dfs(this.graph, startingNode, graphTraverser);
    
    expect(graphTraverser.visitedEdges.length).to.equal(4);
    expect(edgesToArrays(graphTraverser.visitedEdges)).to.deep.equal([[1,0],[1,2],[2,3],[3,4]]);
    expect(graphTraverser.leftEdges.length).to.equal(4);
    expect(edgesToArrays(graphTraverser.leftEdges)).to.deep.equal([[0,1],[4,3],[3,2],[2,1]]);
    expect(graphTraverser.visitedNodes).to.deep.equal([1,0,2,3,4]);
  });
  
  it('can be traversed by bfs search', function(done) {
    let startingNode = 1;
    var graphTraverser = new BasicTraverser();
    
    // Perform the assertions inside the callback, as the BFS
    // is an async function.
    traversals.bfs(this.graph, startingNode, graphTraverser, function() {
      expect(graphTraverser.visitedEdges.length).to.equal(4);
      expect(edgesToArrays(graphTraverser.visitedEdges)).to.deep.equal([[1,0],[1,2],[1,4],[2,3]]);
      expect(graphTraverser.leftEdges.length).to.equal(0);
      expect(edgesToArrays(graphTraverser.leftEdges)).to.deep.equal([]);
      done();
    });
  });
  
  it('can have its transfer nodes merged', function() {
    expect(traversals.mergeTransferNodes(this.graph).G.matrix).to.deep.equal(this.expectedSuperGraph);
  });
  
  it('can be merged twice', function() {
    let numNodes = 5;
    let edgeList = [
      new Edge({ type: 'route', origin: 1, destination: 0, weight: 2 }),
      new Edge({ type: 'transfer', origin: 2, destination: 1, weight: 2 }),
      new Edge({ type: 'route', origin: 4, destination: 1, weight: 2 }),
      new Edge({ type: 'transfer', origin: 3, destination: 2, weight: 2 }),
      new Edge({ type: 'route', origin: 4, destination: 3, weight: 2 }),
      ];
    this.expectedGraph = [
      [],
      [edgeList[0]],
      [null,edgeList[1]],
      [null,null,edgeList[3]],
      [null,edgeList[2],0,edgeList[4]]
    ];
    this.expectedSuperGraph = [
      [],
      [null],
      [{type: 'route', weight: 2, origin: 2, destination: 0},{type: 'route', weight: 2, origin: 2, destination: 1}],
    ];
    this.graph = new TransitGraph(edgeList, numNodes, this.stops);
    expect(traversals.mergeTransferNodes(this.graph).G.matrix).to.deep.equal(this.expectedSuperGraph);
  });
  
  it('can be ranked with Page Rank', function() {
    traversals.pageRank(this.graph);
  });
  
  it('can have its shortest path found by Dijkstra\'s algorithm', function() {
    let start = 1;
    let end = 3;
    let traverser = new BasicTraverser();
    
    this.graph.dijkstra(start,end,traverser);
    
    expect(traverser.results.pathLength).to.equal(4);
    expect(edgesToArrays(traverser.visitedEdges)).to.deep.equal([[1,2],[2,3]]);
  });
  
  it('will fail when provided a negative edge', function() {
    const numNodes = 5;
    const edgeList = [
      new Edge({ type: 'route', origin: 1, destination: 0, weight: 2 }),
      new Edge({ type: 'transfer', origin: 2, destination: 1, weight: 2 }),
      new Edge({ type: 'route', origin: 4, destination: 1, weight: -2 }),
      new Edge({ type: 'transfer', origin: 3, destination: 2, weight: 2 }),
      new Edge({ type: 'route', origin: 4, destination: 3, weight: 2 }),
      ];

    expect(function() { new TransitGraph(edgeList, numNodes, this.stops); }).to.throw(Error);
  });
});

'use strict';

process.env.NODE_ENV = 'test';

var TransitGraph = require('../lib/graph/graph.js');
var Stop = require('../lib/graph/stop.js');
var Edge = require('../lib/graph/edge.js');
var EdgeList = require('../lib/graph/edgeList');
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
    const numNodes = 5;
    const edges = [
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
      [edges[0]],
      [null,edges[1]],
      [null,null,edges[3]],
      [null,edges[2],null,edges[4]]
    ];
    this.expectedSuperGraph = [
      [],
      [null],
      [null,{type: 'route', weight: 2, origin: 2, destination: 1}],
      [{type: 'route', weight: 2, origin: 3, destination: 0},{type: 'route', weight: 2, origin: 3, destination: 1},{type: 'route', weight: 2, origin: 3, destination: 2}],
    ];
    this.graph = new TransitGraph(new EdgeList(edges), numNodes, this.stops);
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
    let edges = [
      new Edge({ type: 'route', origin: 1, destination: 0, weight: 2 }),
      new Edge({ type: 'transfer', origin: 2, destination: 1, weight: 2 }),
      new Edge({ type: 'route', origin: 4, destination: 1, weight: 2 }),
      new Edge({ type: 'transfer', origin: 3, destination: 2, weight: 2 }),
      new Edge({ type: 'route', origin: 4, destination: 3, weight: 2 }),
      ];
    this.expectedGraph = [
      [],
      [edges[0]],
      [null,edges[1]],
      [null,null,edges[3]],
      [null,edges[2],0,edges[4]]
    ];
    this.expectedSuperGraph = [
      [],
      [null],
      [{type: 'route', weight: 2, origin: 2, destination: 0},{type: 'route', weight: 2, origin: 2, destination: 1}],
    ];
    this.graph = new TransitGraph(new EdgeList(edges), numNodes, this.stops);
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
    const edges = [
      new Edge({ type: 'route', origin: 1, destination: 0, weight: 2 }),
      new Edge({ type: 'transfer', origin: 2, destination: 1, weight: 2 }),
      new Edge({ type: 'route', origin: 4, destination: 1, weight: -2 }),
      new Edge({ type: 'transfer', origin: 3, destination: 2, weight: 2 }),
      new Edge({ type: 'route', origin: 4, destination: 3, weight: 2 }),
      ];

    expect(function() {
      new TransitGraph(new EdgeList(edges), numNodes, this.stops);
    }).to.throw(Error);
  });
  
  /* 
  This example is from the following paper:
  
  Accessibility in complex networks
  B.A.N. Travencolo, L. da F. Costa
  Physics Letters A
  
  */
  it('can have its diversity entropy calculated', function() {
    const edges = [
      new Edge({ type: 'route', origin: 0, destination: 1, weight: 1 }),
      new Edge({ type: 'route', origin: 0, destination: 2, weight: 1 }),
      new Edge({ type: 'route', origin: 0, destination: 4, weight: 1 }),
      new Edge({ type: 'route', origin: 2, destination: 3, weight: 1 }),
      new Edge({ type: 'route', origin: 4, destination: 5, weight: 1 }),
      new Edge({ type: 'route', origin: 5, destination: 6, weight: 1 }),
    ];
    const stopList = [
      new Stop(0,'0',0,0,[]),
      new Stop(1,'1',0,0,[]),
      new Stop(2,'2',0,0,[]),
      new Stop(3,'3',0,0,[]),
      new Stop(4,'4',0,0,[]),
      new Stop(5,'5',0,0,[]),
      new Stop(6,'6',0,0,[]),
    ];
    const graph = new TransitGraph(new EdgeList(edges), stopList.length, stopList);
    // Define a threshold with which to evaluate the diversity entropy values
    const epsilon = 0.1;
    
    graph.calculateRandomWalksFrom(0,100,4);
    
    expect((Math.abs(graph.diversityEntropy(0,1) - 1.10)) < epsilon).to.equal(true);
    expect((Math.abs(graph.diversityEntropy(0,2) - 0.73)) < epsilon).to.equal(true);
    expect((Math.abs(graph.diversityEntropy(0,3) - 0.37)) < epsilon).to.equal(true);
    
    // Do the same procedure, but this time with dead end nodes contributing 
    // the remainder of the path length
    graph.calculateRandomWalksFrom(0,100,4,true);
    
    expect((Math.abs(graph.diversityEntropy(0,1) - 1.10)) < epsilon).to.equal(true);
    expect((Math.abs(graph.diversityEntropy(0,2) - 1.10)) < epsilon).to.equal(true);
    expect((Math.abs(graph.diversityEntropy(0,3) - 1.10)) < epsilon).to.equal(true);
  });
  
  it('can have random edges created as part of a Population', function() {
    traversals.findCriticalEdges(this.graph);
  });
});
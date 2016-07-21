'use strict';

process.env.NODE_ENV = 'test';

var TransitGraph = require('../lib/graph.js').TransitGraph;
var mergeTransferNodes = require('../lib/graph.js').mergeTransferNodes;
var BasicTraverser = require('../lib/graphTraverser.js').BasicTraverser;
var traversals = require('../lib/traversals.js');

var expect = require('chai').expect;

/*describe('The graph', function() {
  before(function() {
    let numNodes = 5;
    let edgeList = [
        [1,2], [2,4], [1,4]
      ];
    this.expectedGraph = [
        [],
        [0],
        [0,1],
        [0,0,0],
        [0,1,1,0],
      ];
    this.graph = new TransitGraph({edgeList: edgeList, numNodes: numNodes });
  });
  
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
  
});*/

describe('A transit graph', function() {
  before(function() {
    let numNodes = 5;
    let edgeList = [
      { type: 'route', edge: [1,0] },
      { type: 'transfer', edge: [2,1] },
      { type: 'route', edge: [4,1] },
      { type: 'route', edge: [3,2] },
      { type: 'route', edge: [4,3] },
      ];
    let stops = [
      { stop_name: 'A' },
      { stop_name: 'B' },
      { stop_name: 'C' },
      { stop_name: 'D' },
      { stop_name: 'E' }
    ];
    let route = { type: 'route' };
    let transfer = { type: 'transfer' };
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
      [route,route,route],
    ];
    this.graph = new TransitGraph(edgeList, numNodes, stops);
  });
  
  it('can be created', function() {
    expect(this.graph.G).to.deep.equal(this.expectedGraph);
  });
  
  it('can have its transfer nodes merged', function() {
 //   expect(mergeTransferNodes(this.graph).G).to.deep.equal(this.expectedSuperGraph);
  });
  
  it('can be merged twice', function() {
    let numNodes = 5;
    let edgeList = [
      { type: 'route', edge: [1,0] },
      { type: 'transfer', edge: [2,1] },
      { type: 'route', edge: [4,1] },
      { type: 'transfer', edge: [3,2] },
      { type: 'route', edge: [4,3] },
      ];
    let stops = [
      { stop_name: 'A' },
      { stop_name: 'B' },
      { stop_name: 'C' },
      { stop_name: 'D' },
      { stop_name: 'E' }
    ];
    let route = { type: 'route' };
    let transfer = { type: 'transfer' };
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
      [route,route],
    ];
    this.graph = new TransitGraph(edgeList, numNodes, stops);
    expect(mergeTransferNodes(this.graph).G).to.deep.equal(this.expectedSuperGraph);
  });
  
  it('can be ranked with Page Rank', function() {
    //traversals.pageRank(this.graph);
  });
});

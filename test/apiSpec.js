'use strict';

process.env.NODE_ENV = 'test';

var expect = require('chai').expect;

var server = require('../lib/server/server');
var http = require('http');
var SystemManager = require('../lib/server/systemManager');
var System = require('../lib/server/system');
var TransitGraph = require('../lib/graph/graph');
var Stop = require('../lib/graph/stop');
var Edge = require('../lib/graph/edge');
var EdgeList = require('../lib/graph/edgeList');
var GraphType = require('../lib/enums').GraphType;
var Geometry = require('../lib/enums').Geometry;
var EdgeType = require('../lib/enums').EdgeType;
var Mode = require('../lib/enums').Mode;

//===================================================
// API connection info
//===================================================

const host = (process.env.IP || '0.0.0.0');
const port = (process.env.PORT || 3000);
const pathname = '/api/v0';
const API = `http://${host}:${port}${pathname}`;

//===================================================
// Test Data
//===================================================

const testSys = {
  id: "test",
  location: "Testville",
  latitude: 40.5,
  longitude: -75.5
};
const edges = [
  new Edge({ type: EdgeType.ROUTE, origin: 0, destination: 1, weight: 1 }),
  new Edge({ type: EdgeType.ROUTE, origin: 0, destination: 2, weight: 1 }),
  new Edge({ type: EdgeType.ROUTE, origin: 0, destination: 4, weight: 1 }),
  new Edge({ type: EdgeType.ROUTE, origin: 2, destination: 3, weight: 1 }),
  new Edge({ type: EdgeType.ROUTE, origin: 4, destination: 5, weight: 1 }),
  new Edge({ type: EdgeType.ROUTE, origin: 5, destination: 6, weight: 1 }),
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
SystemManager.add(new System(testSys.id, testSys.location, testSys.latitude, testSys.longitude));
SystemManager.setPrimaryGraph(testSys.id, graph);
SystemManager.setMergedGraph(testSys.id, graph);

//===================================================
// Helper Methods
//===================================================

function getUrl(url) {
  return new Promise((resolve, reject) => {
    let rawData = '';
    
    http.get(url, function(res) {
      res.on('data', function(data) {
        rawData += data;
      });
      res.on('end', function() {
        resolve(JSON.parse(rawData));
      });
    }).on('error', e => {
      reject(e); return;
    });
  });
}

function getEdges(data) {
  return data.features.filter(f => f.geometry.type === Geometry.LineString);
}

function getStops(data) {
  return data.features.filter(f => f.geometry.type === Geometry.Point);
}

function getFeaturesWithRank(data) {
  return data.features.filter(f => f.geometry.type === Geometry.Point && typeof f.properties.rank !== "undefined");
}

//===================================================
// API TEST
//===================================================

describe('The API system endpoint', function() {
  before(function() {
    server.listen(SystemManager);
  });
  
  after(function() {
    server.close();
  });
  
  it('should respond with a system', function() {
    return getUrl(`${API}/system/${testSys.id}`)
      .then(function(data) {
        expect(data.id).to.equal(testSys.id);
        expect(data.location).to.equal(testSys.location);
        expect(data.latitude).to.equal(testSys.latitude);
        expect(data.longitude).to.equal(testSys.longitude);
      });
  });
  
  it('should respond with an error for a bad system ID', function() {
    return getUrl(`${API}/system/badId`)
      .then(function(data) {
        expect(data.error).to.not.be.undefined;
      });
  });
});

describe('The API graph endpoint', function() {
  before(function() {
    function afterServerBoot() {
      SystemManager.analyzeGraphs();
    }
    
    server.listen(SystemManager, afterServerBoot);
  });
  
  after(function() {
    server.close();
  });
  
  it('should respond with an error for a bad graph type', function() {
    return getUrl(`${API}/graph/${testSys.id}?type=badtype`)
      .then(function(data) {
        expect(data.error).to.not.be.undefined;
      });
  });
  it('should respond with an error for a bad filter', function() {
    return getUrl(`${API}/graph/${testSys.id}?filter=badfilter`)
      .then(function(data) {
        expect(data.error).to.not.be.undefined;
      });
  });
  it('should respond with an error for a bad mode', function() {
    return getUrl(`${API}/graph/${testSys.id}?mode=badmode`)
      .then(function(data) {
        expect(data.error).to.not.be.undefined;
      });
  });
  it('should respond with an error for a bad system ID', function() {
    return getUrl(`${API}/graph/badId`)
      .then(function(data) {
        expect(data.error).to.not.be.undefined;
      });
  });
  
  it('should respond with a graph', function() {
    return getUrl(`${API}/graph/${testSys.id}`)
      .then(function(data) {
        expect(data.features).to.not.be.empty;
        
        const edges = getEdges(data);
        const stops = getStops(data);
        
        expect(edges).to.not.be.empty;
        expect(stops).to.not.be.empty;
      });
  });
  
  it('should respond with a second graph type', function() {
    return getUrl(`${API}/graph/${testSys.id}?type=${GraphType.MERGED}`)
      .then(function(data) {
        expect(data.features).to.not.be.empty;
        
        const edges = getEdges(data);
        const stops = getStops(data);
        
        expect(edges).to.not.be.empty;
        expect(stops).to.not.be.empty;
      });
  });
  
  it('should respond with a graph with an edge filter', function() {
    return getUrl(`${API}/graph/${testSys.id}?filter=edges`)
      .then(function(data) {
        expect(data.features).to.not.be.empty;
        
        const edges = getEdges(data);
        const stops = getStops(data);
        
        expect(edges).to.not.be.empty;
        expect(stops).to.be.empty;
      });
  });
  
  it('should respond with a graph with a stop filter', function() {
    return getUrl(`${API}/graph/${testSys.id}?filter=stops`)
      .then(function(data) {
        expect(data.features).to.not.be.empty;
        
        const edges = getEdges(data);
        const stops = getStops(data);
        
        expect(edges).to.be.empty;
        expect(stops).to.not.be.empty;
      });
  });
  
  it('should respond with a graph without ranks', function() {
    return getUrl(`${API}/graph/${testSys.id}`)
      .then(function(data) {
        expect(data.features).to.not.be.empty;
        
        const featuresWithRank = getFeaturesWithRank(data);
        
        expect(featuresWithRank).to.be.empty;
      });
  });
  
  it('should respond with a graph with ranks', function() {
    return getUrl(`${API}/graph/${testSys.id}?mode=${Mode.ACCESSIBILITY}`)
      .then(function(data) {
        expect(data.features).to.not.be.empty;
        
        const featuresWithRank = getFeaturesWithRank(data);
        
        expect(featuresWithRank).to.not.be.empty;
      });
  });
  
});
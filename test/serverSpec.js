'use strict';

var expect = require('chai').expect;

process.env.NODE_ENV = 'test';

var server = require('../lib/server/server.js');
var http = require('http');
var io = require('socket.io-client');
var socketMsg = require('../lib/constants.js');
var createGraph = require('../lib/server/createGraph.js');
var async = require('async');

var socketURL = 'http://' + (process.env.IP || '0.0.0.0') + ':' + (process.env.PORT || 3000);
var http_options = {
  host: (process.env.IP || '0.0.0.0'),
  pathname: '/',
  port: (process.env.PORT || 3000)
};
var options = {
  transports: ['websocket'],
  'force new connection': true
};
/*
describe('The server', function() {
  before(function (done) {
    function loadGraph(callback) {
      createGraph(function(graph, mergedGraph) {
        callback(null, graph, mergedGraph);
      });
    }
    
    function startServer(graph, mergedGraph, callback) {
      server.listen(graph, mergedGraph);
      callback();
    }
    
    async.waterfall([
      function(callback) { loadGraph(callback) },
      function(graph, mergedGraph, callback) { startServer(graph, mergedGraph, callback) }
      ], function(err) {
        if (err) throw err;
        
        done();
      });
  });

  after(function () {
    server.close();
  });

  it('should return 200', function (done) {
    http.get(http_options, function (res) {
      expect(res.statusCode).to.equal(200);
      done();
    });
  });
  
  it('should allow a socket connection', function(done) {
    var socket = io(socketURL, options);
    socket.on('connect', function(){
      expect(socket.connected).to.equal(true);
      done();
    });
  });
  
  it('should respond to a DFS request', function(done) {
    var socket = io(socketURL, options);
    var seenEvent = false;
    
    socket.on('connect', function(){
      socket.emit(socketMsg.startDfs, 'R20');
      socket.on(socketMsg.event, function(event) {
        if (!seenEvent) {
          expect(event.type).to.equal(socketMsg.visitNode);
          expect(event.data).to.be.a.edge;
          done();
        }
        seenEvent = true;
      });
    });
  });
  
  it('should respond with stops', function(done) {
    var socket = io(socketURL, options);
    socket.on('connect', function(){
      socket.emit(socketMsg.requestStops);
      socket.on(socketMsg.sendStops, function(stops) {
        expect(stops.length).to.be.above(0);
        done();
      });
    });
  });
  
  it('should respond with edges', function(done) {
    var socket = io(socketURL, options);
    socket.on('connect', function(){
      socket.emit(socketMsg.requestEdges);
      socket.on(socketMsg.sendEdges, function(edges) {
        expect(edges.type).to.equal('FeatureCollection');
        expect(edges.features.length).to.be.above(0);
        done();
      });
    });
  });
});*/
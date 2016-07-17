'use strict';

var expect = require('chai').expect;
var assert = require('chai').assert;

process.env.NODE_ENV = 'test';

var server = require('../lib/server.js');
var http = require('http');
var io = require('socket.io-client');
var socketMsg = require('../public/js/constants.js');
var createGraph = require('../lib/createGraph.js');
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

describe('The server', function() {
  before(function (done) {
    function loadGraph(callback) {
      createGraph(function(graph) {
        callback(null, graph);
      });
    }
    
    function startServer(graph, callback) {
      server.listen(graph);
      callback();
    }
    
    async.waterfall([
      function(callback) { loadGraph(callback) },
      function(graph, callback) { startServer(graph, callback) }
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
      socket.emit(socketMsg.startDfs, 0);
      socket.on(socketMsg.event, function(event) {
        if (!seenEvent) {
          expect(event.type).to.equal(socketMsg.visitNode);
          done();
        }
        seenEvent = true;
      })
    });
  });
  
  it('should respond with stops', function(done) {
    var socket = io(socketURL, options);
    socket.on('connect', function(){
      socket.emit(socketMsg.requestStops);
      socket.on(socketMsg.sendStops, function(stops) {
        expect(stops.type).to.equal('FeatureCollection');
        expect(stops.features.length).to.be.above(0);
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
});
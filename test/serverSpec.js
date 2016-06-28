'use strict';

var expect = require('chai').expect;
var server = require('../lib/server.js');
var http = require('http');
var io = require('socket.io-client');

var socketURL = 'http://gtfs-realtime-tgreen8091.c9users.io';
var options = {
  transports: ['websocket'],
  'force new connection': true
};

describe('The server', function() {
  before(function () {
    server.listen();
  });

  after(function () {
    server.close();
  });

  it('should return 200', function (done) {
    http.get(socketURL, function (res) {
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
});
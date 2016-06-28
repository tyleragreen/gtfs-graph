'use strict';

var expect = require('chai').expect;
var server = require('../lib/server.js');
var http = require('http');

describe('The server', function() {
  before(function () {
    server.listen();
  });

  after(function () {
    server.close();
  });

  it('should return 200', function (done) {
    http.get('http://gtfs-realtime-tgreen8091.c9users.io', function (res) {
      expect(res.statusCode).to.equal(200);
      done();
    });
  });
});
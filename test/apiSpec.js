'use strict';

var expect = require('chai').expect;

process.env.NODE_ENV = 'test';

var server = require('../lib/server/server');
var http = require('http');
var SystemManager = require('../lib/server/systemManager');
var System = require('../lib/server/system');

const testSys = {
  id: "test",
  location: "Testville",
  latitude: 40.5,
  longitude: -75.5
};
const httpOptions = {
  host: (process.env.IP || '0.0.0.0'),
  pathname: '/api/v0/system/test',
  port: (process.env.PORT || 3000)
};
SystemManager.add(new System(testSys.id, testSys.location, testSys.latitude, testSys.longitude));

describe('The API', function() {
  before(function() {
    server.listen(SystemManager);
  });
  
  after(function() {
    server.close();
  });
  
  it('should respond with a good status code', function(done) {
    http.get(httpOptions, function(res) {
      expect(res.statusCode).to.equal(200);
      done();
    });
  });
  it('should respond with a system', function(done) {
    var host = (process.env.IP || '0.0.0.0');
    var pathname = '/api/v0/system/test';
    var port = (process.env.PORT || 3000);
    let rawData = '';
    http.get(`http://${host}:${port}${pathname}`, function(res) {
      res.on('data', function(data) {
        rawData += data;
      });
      res.on('end', function() {
        let data = JSON.parse(rawData);
        expect(data.id).to.equal(testSys.id);
        expect(data.location).to.equal(testSys.location);
        expect(data.latitude).to.equal(testSys.latitude);
        expect(data.longitude).to.equal(testSys.longitude);
        done();
      });
    });
  });
});
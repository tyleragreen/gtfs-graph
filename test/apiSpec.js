'use strict';

var expect = require('chai').expect;

process.env.NODE_ENV = 'test';

var server = require('../lib/server/server');
var http = require('http');
var SystemManager = require('../lib/server/systemManager');
var System = require('../lib/server/system');

//===================================================
// API connection info
//===================================================

const host = (process.env.IP || '0.0.0.0');
const port = (process.env.PORT || 3000);
const pathname = '/api/v0';
const API = `http://${host}:${port}${pathname}`;

const testSys = {
  id: "test",
  location: "Testville",
  latitude: 40.5,
  longitude: -75.5
};
SystemManager.add(new System(testSys.id, testSys.location, testSys.latitude, testSys.longitude));

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

describe('The API', function() {
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
});
'use strict';

process.env.NODE_ENV = 'test';

var Edge = require('../lib/graph/edge.js');
var expect = require('chai').expect;

describe('An edge', function() {
  it('should fail without the required constructor arguments', function() {
    expect(function() { new Edge({ origin: 1 }) }).to.throw(Error);
  });

  it('should be created', function() {
    let edge = new Edge({ origin: 0, destination: 1, type: 'route', weight: 10}); 
    
    expect(edge.origin).to.equal(0);
    expect(edge.destination).to.equal(1);
    expect(edge.type).to.equal('route');
    expect(edge.weight).to.equal(10);
  });
});
'use strict';

process.env.NODE_ENV = 'test';

var Edge = require('../lib/graph/edge.js');
var expect = require('chai').expect;

describe('An edge', function() {
  it('should fail without the required constructor arguments', function() {
    expect(function() { new Edge({ origin: 1 }) }).to.throw(Error);
  });

  it('should be created', function() {
    const props = { origin: 0, destination: 1, type: 'ROUTE', weight: 10};
    const edge = new Edge(props); 
    
    expect(edge.origin).to.equal(props.origin);
    expect(edge.destination).to.equal(props.destination);
    expect(edge.type).to.equal(props.type);
    expect(edge.weight).to.equal(props.weight);
  });
});
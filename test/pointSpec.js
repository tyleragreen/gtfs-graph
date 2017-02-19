'use strict';

process.env.NODE_ENV = 'test';

var Point = require('../lib/graph/point');
var expect = require('chai').expect;

describe('A point', function() {
  it('can be created', function() {
    const point = new Point(40,65);
    expect(point.latitude).to.equal(40);
    expect(point.longitude).to.equal(65);
  });
});
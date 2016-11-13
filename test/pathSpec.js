'use strict';

process.env.NODE_ENV = 'test';

var Path = require('../lib/graph/path');
var expect = require('chai').expect;

describe('A path', function() {
  it('can be created', function() {
    const path = new Path();
    expect(path.length()).to.equal(0);
    path.add(1);
    expect(path.length()).to.equal(1);
    path.add(2);
    expect(path.length()).to.equal(2);
    expect(path.contains(2)).to.equal(true);
    expect(path.contains(3)).to.equal(false);
    path.add(3);
    expect(path.contains(3)).to.equal(true);
    expect(path.at(2)).to.equal(3);
    
    path.fillTo(5,0);
    expect(path.nodes).to.deep.equal([1,2,3,0,0]);
    
    expect(function() { path.fillTo(4,0) }).to.throw(Error);
  });
});
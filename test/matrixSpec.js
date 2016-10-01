'use strict';

process.env.NODE_ENV = 'test';

var expect = require('chai').expect;
var Matrix = require('../lib/graph/matrix.js');

describe('A matrix', function() {
  it('should fail if not given a length', function() {
    expect(function() { new Matrix() }).to.throw(Error);
  });
  
  it('should be empty when created', function() {
    const length = 4;
    const matrix = new Matrix(length);
    
    expect(matrix.length()).to.equal(length);
    
    expect(function() { matrix.get(4,3) }).to.throw(Error);
    expect(function() { matrix.get(3,5) }).to.throw(Error);
    
    expect(matrix.get(2,0)).to.equal(null);
    expect(matrix.get(0,2)).to.equal(null);
    expect(matrix.get(2,1)).to.equal(null);
    expect(matrix.get(1,2)).to.equal(null);
    expect(matrix.get(2,3)).to.equal(null);
    expect(matrix.get(3,2)).to.equal(null);
    expect(matrix.get(1,3)).to.equal(null);
    expect(matrix.get(3,1)).to.equal(null);
    expect(matrix.get(1,1)).to.equal(null);
  });
  
  it('should have its values set', function() {
    const matrix = new Matrix(4);
    const origin = 2;
    const distances = [4,2,0,5];
    
    matrix.setRow(origin, distances);
    
    expect(function() { matrix.get(4,3) }).to.throw(Error);
    expect(function() { matrix.get(3,5) }).to.throw(Error);
    
    expect(matrix.get(2,0)).to.equal(4);
    expect(matrix.get(0,2)).to.equal(4);
    expect(matrix.get(2,1)).to.equal(2);
    expect(matrix.get(1,2)).to.equal(2);
    expect(matrix.get(2,3)).to.equal(5);
    expect(matrix.get(3,2)).to.equal(5);
    expect(matrix.get(1,3)).to.equal(null);
    expect(matrix.get(3,1)).to.equal(null);
    expect(matrix.get(1,1)).to.equal(null);
  });
});
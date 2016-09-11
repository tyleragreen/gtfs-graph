'use strict';

process.env.NODE_ENV = 'test';

var Stop = require('../lib/graph/stop.js');

var expect = require('chai').expect;

describe('A stop', function() {
  before(function() {
    this.stopOne = new Stop(0,'Stop One', 40, 50, ['1','2']);
    this.stopTwo = new Stop(1,'Stop Two', -40, 75, ['3','2']);
  });
  
  it('should be created', function() {
    expect(this.stopOne.id).to.equal(0);
    expect(this.stopTwo.name).to.equal('Stop Two');
  });
  
  it('should be merged with another stop', function() {
    let newStop = this.stopOne.mergeWith(this.stopTwo);
    
    expect(newStop.id).to.equal('0-1');
    expect(newStop.name).to.equal('Stop One / Stop Two');
    expect(newStop.latitude).to.equal(0);
    expect(newStop.longitude).to.equal(62.5);
    expect(newStop.routes).to.deep.equal(['1','2','3']);
  });
  
  it('avoids appending a non-unique name', function() {
    let stopThree = new Stop(2,'Stop One',0,0,['1']);
    let newStop = this.stopOne.mergeWith(stopThree);
    
    expect(newStop.name).to.equal(stopThree.name);
  });
  
  it('avoids appending a non-unique name when there are at least three', function() {
    let stopThree = new Stop(2,'Stop One',0,0,['1']);
    let newStopOne = this.stopOne.mergeWith(this.stopTwo);
    let newStopTwo = newStopOne.mergeWith(stopThree);
    
    expect(newStopTwo.name).to.equal(newStopOne.name);
  });
});
'use strict';

process.env.NODE_ENV = 'test';

var Enum = require('../lib/enum');

var expect = require('chai').expect;

let Mode = Enum(['BEST','WORST']);

describe('An enum', function() {
  it('should fail if created without an array', function() {
    expect(function() {
      Enum('BEST','WORST');
    }).to.throw(Error);
  });
  it('has members that equal themselves', function() {
    expect(Mode.WORST).to.equal(Mode.WORST);
  });
  it('can return all its members', function() {
    expect(Mode.ALL).to.deep.equal([Mode.BEST,Mode.WORST]); 
  });
  it('should test for membership', function() {
    expect(Mode.isValid('BEST')).to.equal(true);
    expect(Mode.isValid('NOT_BEST')).to.equal(false);
  });
  it('should fail to modify a member', function() {
    expect(function() {
      Mode.BEST = Symbol('medium best');
    }).to.throw(Error);
  });
  it('should fail to add a member', function() {
    expect(function() {
      Mode.MEDIUM_BEST = Symbol('medium best');
    }).to.throw(Error);
  });
  it('should fail to access a missing member', function() {
    expect(function() {
      console.log('Second worst value is: ' + Mode.SECOND_WORST);
    }).to.throw(Error);
  });
});
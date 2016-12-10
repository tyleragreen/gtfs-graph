'use strict';

process.env.NODE_ENV = 'test';

var Enum = require('../lib/enum');

var expect = require('chai').expect;

describe('An enum', function() {
  it('can be created', function() {
    let Modes = Enum(['BEST','WORST']);
  });
});
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
  
  it('can find the distance between two points', function() {
    const nyc = new Point(40.7127, -74.0059);
    const boston = new Point(42.358056, -71.063611);
    const kmConversion = 1000;
    const miConversion = 0.621371;
    const distanceInKilometers = 306;
    const distanceInMeters = distanceInKilometers * kmConversion;
    const distanceInMiles = distanceInKilometers * miConversion;
    const epsilon = 1;
    
    expect((nyc.distanceInKilometers(boston) - distanceInKilometers) < epsilon).to.equal(true);
    expect((nyc.distanceInMeters(boston) - distanceInMeters) < epsilon).to.equal(true);
    expect((nyc.distanceInMiles(boston) - distanceInMiles) < epsilon).to.equal(true);
  });
});
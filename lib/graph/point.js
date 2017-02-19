'use strict';

class Point {
  constructor(lat, lon) {
    this.latitude = lat;
    this.longitude = lon;
  }
  
  distanceTo(point) {
    return 0;
  }
}

module.exports = Point;
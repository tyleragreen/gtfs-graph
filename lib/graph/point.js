'use strict';

class Point {
  constructor(lat, lon) {
    this.latitude = lat;
    this.longitude = lon;
  }
  
  /*
  This implementation if from this webpage:
  http://www.movable-type.co.uk/scripts/latlong.html
  */
  distanceInMeters(point) {
    function toRadians(deg) {
      return deg * (Math.PI/180);
    }
    const lat1 = this.latitude;
    const lon1 = this.longitude;
    const lat2 = point.latitude;
    const lon2 = point.longitude;
    const R = 6371e3; // metres
    
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2-lat1);
    const Δλ = toRadians(lon2-lon1);
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    
    return d;
  }
  
  distanceInKilometers(point) {
    const conversion = 1000;
    return this.distanceInMeters(point) / conversion;
  }
  
  distanceInMiles(point) {
    const conversion = 0.621371;
    return this.distanceInKilometers(point) * conversion;
  }
}

module.exports = Point;
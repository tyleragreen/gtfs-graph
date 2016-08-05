'use strict';

class Stop {
  constructor(id, name, latitude, longitude, routes) {
    this.id = id;
    this.name = name;
    this.latitude = latitude;
    this.longitude = longitude;
    this.routes = routes;
  }
  
  mergeWith(stop) {
    let id = String(this.id) + '-' + String(stop.id);
    let name = this.name + ' / ' + stop.name;
    let latitude = (this.latitude + stop.latitude) / 2;
    let longitude = (this.longitude + stop.longitude) / 2;
    let routes = this.routes.concat(stop.routes);
    let uniqueRoutes = Array.from(new Set(routes));
    
    return new Stop(id, name, latitude, longitude, uniqueRoutes);
  }
}

module.exports = Stop;
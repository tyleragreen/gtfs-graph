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
    const id = String(this.id) + '-' + String(stop.id);
    
    let name;
    // Combine the names in the pattern 'Name A / Name B / ...',
    // but only if the new addition does not exist in the chain yet
    if (this.name.split('/').map(name => name.trim()).indexOf(stop.name) === -1) {
      name = this.name + ' / ' + stop.name;
    } else {
      name = this.name;
    }
    
    // For now, get the coordinates simply by taking the average
    // of the existing coordinates. Not sure of a better way to do this.
    const latitude = (this.latitude + stop.latitude) / 2;
    const longitude = (this.longitude + stop.longitude) / 2;
    
    // Get the unique routes for the new stop by converting the array
    // into a set and back to an array.
    const routes = this.routes.concat(stop.routes);
    const uniqueRouteIds = Array.from(new Set(routes.map(route => route.id)));
    const uniqueRoutes= [];
    // Only save the first route that matches a unique id (you are guaranteed
    // to have at least one, based on how uniqueRouteIds was calculated)
    uniqueRouteIds.forEach(function(id, index) {
      uniqueRoutes.push(routes.filter(route => route.id === id)[0]);
    });
    
    return new Stop(id, name, latitude, longitude, uniqueRoutes);
  }
}

module.exports = Stop;
'use strict';

class System {
  constructor(id, location, latitude, longitude, graph) {
    this.id = id;
    this.location = location;
    this.latitude = latitude;
    this.longitude = longitude;
    this.graphs = {};
  }
  
  //-------------------------------------------------
  // Return the System information without the TransitGraph object
  getInfo() {
    
    // TODO if we ever use Babel on the backend (or Node supports destructuring),
    // use "const { graph, ...systemInfo } = system;" here.
    return {
      id: this.id,
      location: this.location,
      latitude: this.latitude,
      longitude: this.longitude
    };
  }
}

module.exports = System;
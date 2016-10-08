'use strict';

class System {
  constructor(id, location, latitude, longitude, graph) {
    this.id = id;
    this.location = location;
    this.latitude = latitude;
    this.longitude = longitude;
    this.graph = graph;
  }
}

module.exports = System;
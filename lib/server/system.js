'use strict';

class System {
  constructor(id, latitude, longitude, graph) {
    this.id = id;
    this.latitude = latitude;
    this.longitude = longitude;
    this.graph = graph;
  }
}

module.exports = System;
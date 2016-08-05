'use strict';

class Edge {
  constructor(type, origin, destination, weight) {
    this.type = type;
    this.origin = origin;
    this.destination = destination;
    this.weight = weight;
  }
}

module.exports = Edge;
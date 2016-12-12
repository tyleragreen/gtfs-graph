'use strict';

var EdgeType = require('../enums').EdgeType;

class Edge {
  constructor(props) {
    const requiredProps = ['type','origin','destination','weight'];
    
    requiredProps.forEach(function(prop) {
      if (!props.hasOwnProperty(prop)) {
        throw new Error('A new edge must contain a property: ' + prop);
      }
    });
    
    if (isNaN(props.weight)) {
      throw new Error('bad edge weight: ' + props.weight);
    }
    
    // Raise the type to upper case to match the EdgeType enum
    this.type = EdgeType[props.type.toUpperCase()];
    this.origin = props.origin;
    this.destination = props.destination;
    this.weight = props.weight;
  }
}

module.exports = Edge;
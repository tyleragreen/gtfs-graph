'use strict';

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
    
    this.type = props.type;
    this.origin = props.origin;
    this.destination = props.destination;
    this.weight = props.weight;
  }
}

module.exports = Edge;
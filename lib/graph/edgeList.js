'use strict';

var Edge = require('./edge');

class EdgeList {
  constructor() {
    this.list = [];
  }
  
  //------------------------------------------------- 
  // Return the list's length
  length() {
    return this.list.length;
  }
  
  //------------------------------------------------- 
  // Add an edge to the list
  add(edge) {
    if (!(edge instanceof Edge)) {
      throw new Error('Only an Edge can be added to an EdgeList!');
    }
    this.list.push(edge);
  }
  
  //------------------------------------------------- 
  // Provide a general filter mechanism
  filter(func) {
    return this.list.filter(func);
  }
  
  //------------------------------------------------- 
  // Provide an iterator over the edge list
  forEach(func) {
    for (let i=0; i < this.length(); i++) {
      func(this.list[i]);
    }
  }
 
  //------------------------------------------------- 
  // Search to see if the edge list contains the edge identified by its
  // origin and destination ID
  contains(origin, destination) {
    let foundEdges = this.list.filter(function(edge) {
      return edge.origin === origin && edge.destination === destination;
    });
    
    if (foundEdges.length === 0) {
        return null;
    } else if (foundEdges.length === 1) {
        return foundEdges[0];
    } else {
        throw new Error('EdgeList contains multiple Edges with origin='+origin+' and destination='+destination);
    }
  }
}

module.exports = EdgeList;
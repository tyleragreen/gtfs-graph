'use strict';

var Edge = require('./edge');
var utils = require('../utils');

class EdgeList {
  constructor(edges) {
    if (typeof edges === "undefined") {
      this.list = [];
    } else {
      this.list = edges;
    }
  }
  
  //------------------------------------------------- 
  // Return the list's length
  length() {
    return this.list.length;
  }
  
  //------------------------------------------------- 
  // Add an edge to the list
  add(edge) {
    utils.checkType(edge, Edge);
    this.list.push(edge);
  }
  
  //-------------------------------------------------
  // Get an edge from the list
  get(index) {
    if (index >= this.length()) {
      throw new Error('bad index='+index+' for EdgeList of length='+this.length());
    }
    return this.list[index];
  }
  
  //------------------------------------------------- 
  // Provide a general filter mechanism
  filter(func) {
    return new EdgeList(this.list.filter(func));
  }
  
  //-------------------------------------------------
  // Return a new edge list which combines the given edge
  // list with our current list of edges
  append(edges) {
    utils.checkType(edges, EdgeList);
    
    return new EdgeList(this.list.concat(edges.list));
  }
  
  //-------------------------------------------------
  // Return an edge list which is this current edge 
  // list crossed (mated) with another edge list.
  // This has applications for genetic algorithms.
  crossover(otherEdgeList) {
    const size = this.length();
    utils.checkType(otherEdgeList, EdgeList);
    utils.assert(size === otherEdgeList.length(), 'Edge list sizes must match to perform crossover.');
    
    let middle;
    if (utils.coinFlip()) {
      middle = Math.floor(size / 2);
    } else {
      middle = Math.ceil(size / 2);
    }
    
    const firstHalf = this.list.slice(0,middle);
    const secondHalf = this.list.slice(middle,size);
    const newList = new EdgeList(firstHalf.concat(secondHalf));
    
    utils.assert(newList.length() === size, 'Size does not match after crossover.');
    
    return newList;
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
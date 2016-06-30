'use strict';

var socketMsg = require('../public/js/constants.js');

var GraphTraverser = function(graph, eventQueue) {
  this.graph = graph;
  this.eventQueue = eventQueue;  
};

GraphTraverser.prototype.visit = function(node, parent) {
  let edge = [ this.graph.stops[node], this.graph.stops[parent] ];
  let event = {
    type: socketMsg.visitNode,
    data: edge
  };
  this.eventQueue.push(event);
};

GraphTraverser.prototype.leave = function(node, parent) {
  let edge = [ this.graph.stops[node], this.graph.stops[parent] ];
  let event = { 
    type: socketMsg.leaveNode,
    data: edge
  };
  this.eventQueue.push(event);
}

module.exports = GraphTraverser;
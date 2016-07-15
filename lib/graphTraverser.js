'use strict';

var socketMsg = require('../public/js/constants.js');
var EventQueue = require('./eventQueue.js');

var GraphTraverser = function(graph, socket) {
  this.graph = graph;
  this.eventQueue = new EventQueue(20, function (queue) {
    socket.emit(socketMsg.event, queue.shift());
  });
};

GraphTraverser.prototype.reset = function() {
  this.eventQueue.clear();
};

GraphTraverser.prototype.visit = function(start, end) {
  let edge = [ this.graph.stops[start], this.graph.stops[end] ];
  let event = {
    type: socketMsg.visitNode,
    data: edge
  };
  this.eventQueue.push(event);
};

GraphTraverser.prototype.leave = function(start, end) {
  let edge = [ this.graph.stops[start], this.graph.stops[end] ];
  let event = { 
    type: socketMsg.leaveNode,
    data: edge
  };
  this.eventQueue.push(event);
}

module.exports = GraphTraverser;
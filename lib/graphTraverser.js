'use strict';

var socketMsg = require('../public/js/constants.js');
var EventQueue = require('./eventQueue.js');

class SocketTraverser {
  constructor(graph, socket) {
    this.graph = graph;
    this.eventQueue = new EventQueue(20, function (queue) {
      socket.emit(socketMsg.event, queue.shift());
    });
  }

  reset() {
    this.eventQueue.clear();
  }
  
  visitNode(node) {
    
  }
  
  visit(edge) {
    let event = {
      type: socketMsg.visitNode,
      data: edge
    };
    this.eventQueue.push(event);
  }

  leave(edge) {
    let event = { 
      type: socketMsg.leaveNode,
      data: edge
    };
    this.eventQueue.push(event);
  }
  
  summary(length) {
    let event = {
      type: socketMsg.summary,
      data: length
    };
    this.eventQueue.push(event);
  }
}

class BasicTraverser {
  constructor() {
    this.visitedEdges = [];
    this.leftEdges = [];
    this.visitedNodes = [];
    this.data = null;
  }
  visit(edge) {
    this.visitedEdges.push(edge);
  }
  visitNode(node) {
    this.visitedNodes.push(node);
  }
  leave(edge) {
    this.leftEdges.push(edge);
  }
  summary(data) {
    this.data = data;
  }
}

module.exports = { SocketTraverser: SocketTraverser,
                   BasicTraverser: BasicTraverser
};

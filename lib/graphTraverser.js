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
  
  visit(start, end) {
    let edge = [ this.graph.stops[start], this.graph.stops[end] ];
    let event = {
      type: socketMsg.visitNode,
      data: edge
    };
    this.eventQueue.push(event);
  }

  leave(start, end) {
    let edge = [ this.graph.stops[start], this.graph.stops[end] ];
    let event = { 
      type: socketMsg.leaveNode,
      data: edge
    };
    this.eventQueue.push(event);
  }
}

class BasicTraverser {
  constructor() {
    this.visitedEdges = [];
    this.leftEdges = [];
    this.visitedNodes = [];
  }
  visit(start, end) {
    this.visitedEdges.push([start, end]);
  }
  visitNode(node) {
    this.visitedNodes.push(node);
  }
  leave(start, end) {
    this.leftEdges.push([start, end]);
  }
}

class DijkstraTraverser {
  constructor() {
    this.shortestPathLength = 0;
    this.shortestPath = [];
  }
}

module.exports = { SocketTraverser: SocketTraverser,
                   BasicTraverser: BasicTraverser,
                   DijkstraTraverser: DijkstraTraverser
};

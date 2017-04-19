'use strict';

var socketMsg = require('../constants.js');
var EventQueue = require('./eventQueue.js');

class SocketTraverser {
  constructor(socket) {
    this.eventQueue = new EventQueue(20, function (queue) {
      socket.emit(socketMsg.event, queue.shift());
    });
    this.visitedNodes = [];
  }

  reset() {
    this.eventQueue.clear();
    this.visitedNodes = [];
  }
  
  visitNode(node) {
    this.visitedNodes.push(node);
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
  
  recordRanks(ranks) {
    let event = {
      type: socketMsg.showRanks,
      data: ranks
    };
    this.eventQueue.push(event);
  }
  
  summary(data) {
    let event = {
      type: socketMsg.summary,
      data: data
    };
    this.eventQueue.push(event);
  }
}

module.exports = SocketTraverser;

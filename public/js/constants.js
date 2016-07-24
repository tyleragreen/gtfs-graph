const socketMsg = {
  log: 'log',
  requestStops: 'request stops',
  sendStops: 'send stops',
  requestEdges: 'request edges',
  sendEdges: 'send edges',
  sendPR: 'send page rank',
  startDfs: 'start dfs',
  startBfs: 'start bfs',
  startPR: 'start pr',
  event: 'event',
  visitNode: 'visit node',
  leaveNode: 'leave node'
};

Object.freeze(socketMsg);

module.exports = socketMsg;
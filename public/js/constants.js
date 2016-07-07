const socketMsg = {
  log: 'log',
  requestStops: 'request stops',
  sendStops: 'send stops',
  requestEdges: 'request edges',
  sendEdges: 'send edges',
  startDfs: 'start dfs',
  startBfs: 'start bfs',
  event: 'event',
  visitNode: 'visit node',
  leaveNode: 'leave node'
};

Object.freeze(socketMsg);

module.exports = socketMsg;
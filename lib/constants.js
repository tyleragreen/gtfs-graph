const socketMsg = {
  log: 'log',
  requestStops: 'request stops',
  sendStops: 'send stops',
  sendMergedStops: 'send merged stops',
  requestEdges: 'request edges',
  sendEdges: 'send edges',
  requestMergedEdges: 'request merged edges',
  sendMergedEdges: 'send merged edges',
  sendPR: 'send page rank',
  startDfs: 'start dfs',
  startBfs: 'start bfs',
  startPR: 'start pr',
  startDijkstra: 'start dij',
  dijkstra: 'dij',
  dfs: 'dfs',
  bfs: 'bfs',
  pageRank: 'pr',
  clearQueue: 'clearQueue',
  event: 'event',
  visitNode: 'visit node',
  leaveNode: 'leave node',
  showRanks: 'show rank',
  summary: 'summary'
};

Object.freeze(socketMsg);

module.exports = socketMsg;
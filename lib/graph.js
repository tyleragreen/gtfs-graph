var Graph = function(in_edge_list, in_num_nodes) {
  if (in_edge_list && in_num_nodes) {
    edgeList = in_edge_list;
    numNodes = in_num_nodes;
  }
};

Graph.prototype.toGraph = function() {
  var graph = [];

  for (i = 0; i < numNodes; i++) {
    graph.push([]);
    for (j = 0; j < numNodes; j++) {
      graph[i][j] = 0;
    }
  }
  
  for (var edge in edgeList) {
    graph[edgeList[edge][0]][edgeList[edge][1]] = 1;
  }
  return graph;
};

Graph.prototype.getArray = function() {
  return this.toGraph();
}

module.exports = Graph;

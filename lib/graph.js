var Graph = function(in_edge_list, in_num_nodes) {
  if (in_edge_list && in_num_nodes) {
    edge_list = in_edge_list;
    num_nodes = in_num_nodes;
  }
};

Graph.prototype.toGraph = function() {
  var graph = [];

  for (i = 0; i < num_nodes; i++) {
    graph.push([]);
    for (j = 0; j < num_nodes; j++) {
      graph[i][j] = 0;
    }
  }
  
  for (edge of edge_list) {
    graph[edge[0]][edge[1]] = 1;
  }
  return graph;
};

module.exports = Graph;

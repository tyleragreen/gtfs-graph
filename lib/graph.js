var Graph = function(in_edge_list, in_num_nodes) {
  if (in_edge_list && in_num_nodes) {
    edgeList = in_edge_list;
    numNodes = in_num_nodes;

    G = this.toGraph();

    D = [];
    for (var i = 0; i < numNodes; i++) D.push(false);
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
  
  for (var edgeIndex in edgeList) {
    graph[edgeList[edgeIndex][0]][edgeList[edgeIndex][1]] = 1;
  }
  return graph;
};

Graph.prototype.getArray = function() {
  return this.toGraph();
}

Graph.prototype.edgesAsGeoJson = function(nodes) {
  var edgesGeoJson = [];
  
  for (var edgeIndex in edgeList) {
    var originNode = nodes[edgeList[edgeIndex][0]];
    var destNode = nodes[edgeList[edgeIndex][1]];
    
    edgesGeoJson.push({
      'type': 'Feature',
      'geometry': {
        'type': 'LineString',
        'coordinates': [
            [ originNode.stop_lon, originNode.stop_lat ],
            [ destNode.stop_lon, destNode.stop_lat ]
          ]
      }
    });
  }
  edgesGeoJson = {
    'type': 'FeatureCollection',
    'features': edgesGeoJson
  };
  
  return edgesGeoJson;
}

Graph.prototype.dfs = function(node, parent) {
  D[node] = true;
  for (var i = 0; i < G[node].length; i++) {
    if (G[node][i] === 1) {
      if (!D[i]) {
        this.dfs(i, node);
      }
    }
  }
  D[node] = false;
}

module.exports = Graph;

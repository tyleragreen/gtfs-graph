'use strict';

class Graph {
  constructor(in_edge_list, in_num_nodes) {
    if (in_edge_list === undefined || in_num_nodes === undefined) {
      throw 'bad';
    }
    if (in_edge_list && in_num_nodes) {
      this.edgeList = in_edge_list;
      this.numNodes = in_num_nodes;
      this.G = this.toGraph();
    }
  }

  toGraph() {
    const graph = [];
  
    for (let i = 0; i < this.numNodes; i++) {
      graph.push([]);
      for (let j = 0; j < this.numNodes; j++) {
        graph[i][j] = 0;
      }
    }
    
    for (let edgeIndex in this.edgeList) {
      let edge = this.edgeList[edgeIndex];
      graph[edge[0]][edge[1]] = 1;
    }
    return graph;
  }

  getArray() {
    return this.toGraph();
  }
}

class TransitGraph extends Graph {
  constructor(edgeList, numNodes, stops) {
    /*if (!edgeList.hasProperty('type')) throw 'need a type';
    if (!edgeList.hasProperty('edge')) throw 'need an edge';
    */
    let untypedEdgeList = edgeList.map(edge => edge.edge);
    super(untypedEdgeList, numNodes);
    this.edgeList = edgeList;
    this.stops = stops;
  }
  
  edgesAsGeoJson() {
    const edgesGeoJson = [];
    
    for (let edgeIndex in this.edgeList) {
      let edge = this.edgeList[edgeIndex].edge;
      let originNode = this.stops[edge[0]];
      let destNode = this.stops[edge[1]];
      
      edgesGeoJson.push({
        'type': 'Feature',
        'properties': {
          'edgeType': this.edgeList[edgeIndex].type
        },
        'geometry': {
          'type': 'LineString',
          'coordinates': [
              [ originNode.stop_lon, originNode.stop_lat ],
              [ destNode.stop_lon, destNode.stop_lat ]
            ]
        }
      });
    }
    return {
      'type': 'FeatureCollection',
      'features': edgesGeoJson
    };
  }

  stopsAsGeoJson() {
    var stopsGeoJson = [];
    
    for (var stopIndex in this.stops) {
      stopsGeoJson.push({
        'type': 'Feature',
        'properties': {
          'id': stopIndex,
          'name': this.stops[stopIndex].stop_name
        },
        'geometry': {
          'type': 'Point',
          'coordinates': [this.stops[stopIndex].stop_lon, this.stops[stopIndex].stop_lat]
        }
      });
    }
    stopsGeoJson = {
      'type': 'FeatureCollection',
      'features': stopsGeoJson
    };
    
    return stopsGeoJson;
  }
}

module.exports = { Graph: Graph, TransitGraph: TransitGraph };

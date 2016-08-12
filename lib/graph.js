'use strict';

class TransitGraph {
  
  //-------------------------------------------------
  constructor(in_edge_list, in_num_nodes, in_stops) {
    this.numNodes = in_num_nodes;
    this.edgeList = in_edge_list;
    this.stops = in_stops;
    this.G = this.toGraph();
  }
  
  //-------------------------------------------------
  length() {
    return this.G.length;
  }
  
  //-------------------------------------------------
  edgeExists(vert, horz) {
    if (vert < horz && this.G[horz][vert] !== 0) {
      return true;
    } else if (vert > horz && this.G[vert][horz] !== 0) {
      return true;
    } else {
      return false;
    }
  }
  
  //-------------------------------------------------
  getStopIds() {
    return this.stops.map(stop => stop.id);
  }
  
  //-------------------------------------------------
  getStopIndex(stopId) {
    var stopIndex = this.getStopIds().indexOf(stopId);
    if (stopIndex === -1) { throw 'bad stop id ' + stopId; }
    
    return stopIndex;
  }
  
  //-------------------------------------------------
  getWeight(vert, horz) {
    if (vert < horz && this.G[horz][vert] !== 0) {
      return this.G[horz][vert].weight;
    } else if (vert > horz && this.G[vert][horz] !== 0) {
      return this.G[vert][horz].weight;
    } else {
      throw 'edge does not exist!';
    }
  }
  
  //-------------------------------------------------
  getTransferEdges() {
    return this.edgeList.filter(edge => edge.type === 'transfer');
  }
  
  //-------------------------------------------------
  // Create an adjacency matrix out of the edge list,
  // preserving the edge type and weight
  toGraph() {
    const graph = [];
  
    for (let i = 0; i < this.numNodes; i++) {
      graph.push([]);
      for (let j = 0; j < this.numNodes; j++) {
        if (j < i) {
          graph[i][j] = 0;
        }
      }
    }
    
    for (let edgeIndex in this.edgeList) {
      let edge = this.edgeList[edgeIndex].edge;
      let max = Math.max(edge[0],edge[1]);
      let min = Math.min(edge[0],edge[1]);
      graph[max][min] = { type: this.edgeList[edgeIndex].type,
                          weight: this.edgeList[edgeIndex].weight };
    }
    return graph;
  }
  
  //-------------------------------------------------
  // Return the list of edges as GeoJSON, including 
  // an edgeType property for each edge
  edgesAsGeoJsonFeatures() {
    const edgesGeoJson = [];
    
    for (let edgeIndex = 0; edgeIndex < this.edgeList.length; edgeIndex++) {
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
              [ originNode.longitude, originNode.latitude ],
              [ destNode.longitude, destNode.latitude ]
            ]
        }
      });
    }
    return {
      'type': 'FeatureCollection',
      'features': edgesGeoJson
    };
  }

  //-------------------------------------------------
  // Return a list of stops in this transit graph in 
  // GeoJSON format (which places each stop at the 
  // correct (lat,lon)), setting the 'rank' property of each feature
  // if it is provided.
  stopsAsGeoJson(ranks) {
    var stopsGeoJson = [];
    
    for (var stopIndex in this.stops) {
      let feature = {
        'type': 'Feature',
        'properties': {
          'id': this.stops[stopIndex].id,
          'name': this.stops[stopIndex].name,
          'routes': this.stops[stopIndex].routes
        },
        'geometry': {
          'type': 'Point',
          'coordinates': [this.stops[stopIndex].longitude, this.stops[stopIndex].latitude]
        }
      };
      if (ranks) { feature.properties.rank = ranks[stopIndex]; }
      stopsGeoJson.push(feature);
    }
    stopsGeoJson = {
      'type': 'FeatureCollection',
      'features': stopsGeoJson
    };
    
    return stopsGeoJson;
  }
  
}

module.exports = TransitGraph;

'use strict';

var Map = function(onLoad) {
  var latitude   = 40.72;
  var longitude  = -74.0;
  var zoom_level = 10;
  mapboxgl.accessToken = 'pk.eyJ1IjoiZ3JlZW50IiwiYSI6ImNpazBqdWFsOTM5Nnh2M2x6dWZ2dnB3aHkifQ.97-pFPD8lQf02B6edag1rA';
  
  this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v9',
      center: [longitude, latitude],
      zoom: zoom_level
  });
  
  this.visitedPopups = [];
  
  this.map.addControl(new mapboxgl.Navigation({
    'position': 'top-left'
  }));
    
  this.map.on('load', function(){
    onLoad();
  });
  this.visitedEdges = {
    type: 'FeatureCollection',
    features: []
  };
  this.leftEdges = {
    type: 'FeatureCollection',
    features: []
  };
};

Map.prototype.clear = function() {
  this.visitedEdges = {
    type: 'FeatureCollection',
    features: []
  };
  this.map.getSource('visited edges').setData(this.visitedEdges);
  
  this.leftEdges = {
    type: 'FeatureCollection',
    features: []
  };
  this.map.getSource('left edges').setData(this.leftEdges);
};

Map.prototype.addStops = function(stops) {
  this.map.addSource('stops', {
    "type": "geojson",
    "data": stops
  });
  
  this.map.addLayer({
    "id": 'stops',
    "type": "symbol",
    "source": 'stops',
    "layout": {
      "icon-image": "marker-11"
    }
  });
  var self = this;
  
  $('#sel-stop').html(stops.features[24].properties.name);
  self.selectedStop = parseInt(stops.features[24].properties.id);
  
  var popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });
  this.map.on('mousemove', function(e) {
    var features = self.map.queryRenderedFeatures(e.point, { layers: ['stops'] });
    self.map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
    
    if (!features.length) {
      popup.remove();
      return;
    }
  
    var feature = features[0];
    popup.setLngLat(feature.geometry.coordinates)
      .setHTML(feature.properties.name)
      .addTo(self.map); 
  });
  this.map.on('click', function(e) {
    var features = self.map.queryRenderedFeatures(e.point, { layers: ['stops'] });
    
    if (!features.length) {
      return;
    }
    
    var feature = features[0];
    
    $('#sel-stop').html(feature.properties.name);
    self.selectedStop = parseInt(feature.properties.id);
  });
};

Map.prototype.addEdges = function(edges) {
  let createLayer = function(map, id, data, color, width, opacity) {
    map.addSource(id, {
      type: 'geojson',
      data: {
        'type': 'FeatureCollection',
        'features': data
      }
    });
    map.addLayer({
      id: id,
      type: 'line',
      source: id,
      paint: {
        'line-width': width,
        'line-color': color,
        'line-opacity': opacity
      }
    });
  };
    
  let transferEdges = edges.features.filter(feature => feature.properties.edgeType == 'transfer');
  let routeEdges = edges.features.filter(feature => feature.properties.edgeType == 'route');
  createLayer(this.map, 'transfers', transferEdges, '#708090', 2, 0.7);
  createLayer(this.map, 'routes', routeEdges, '#ffffff', 2, 0.7);
  
  // Create source and layer for visited edges to be populated later
  createLayer(this.map, 'visited edges', this.visitedEdges, '#ff0000', 3, 1.0);
  // Create source and layer for visited edges to be populated later
  createLayer(this.map, 'left edges', this.leftEdges, '#0000ff', 3, 1.0);
};

Map.prototype.visitEdge = function(edge) {
  this.visitedEdges.features.push({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
          [ edge[0].stop_lon, edge[0].stop_lat ],
          [ edge[1].stop_lon, edge[1].stop_lat ]
        ]
    }
  });
  this.map.getSource('visited edges').setData(this.visitedEdges);
  
  //var newPopup = new mapboxgl.Popup({
  //  closeButton: false,
  //  closeOnClick: false
  //});
  //newPopup.setLngLat([edge[0].stop_lon, edge[0].stop_lat])
  //    .setHTML('Visiting!')
  //    .addTo(this.map);
  //this.visitedPopups.push(newPopup);
  //var self = this;
  //setTimeout(function() {
  //  var popupToRemove = self.visitedPopups.shift();
  //  popupToRemove.remove();
  //}, 30);
};

Map.prototype.leaveEdge = function(edge) {
  this.leftEdges.features.push({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
          [ edge[0].stop_lon, edge[0].stop_lat ],
          [ edge[1].stop_lon, edge[1].stop_lat ]
        ]
    }
  });
  this.map.getSource('left edges').setData(this.leftEdges);
};

module.exports = Map;
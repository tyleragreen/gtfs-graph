'use strict';

import MapboxGl from "mapbox-gl";

const DEFAULT_START = 24; // Times Square / 42nd Street
const UNINCLUDED_ROUTES = ["SI"];

// Hack to preload images
var images = ['1','2','3','4','5','6','6x','7','7x','a','b','c','d','e','f','fs','g','gs','j','l','m','n','q','r','si','z'];
images.forEach(function(img) {
  var image = new Image();
  image.src = 'icons/' + img + '.png';
});

var Map = function(onLoad) {
  var latitude   = 40.75;
  var longitude  = -73.96;
  var zoom_level = 13;
  MapboxGl.accessToken = 'pk.eyJ1IjoiZ3JlZW50IiwiYSI6ImNpazBqdWFsOTM5Nnh2M2x6dWZ2dnB3aHkifQ.97-pFPD8lQf02B6edag1rA';
  
  this.map = new MapboxGl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v9',
      center: [longitude, latitude],
      zoom: zoom_level
  });
  
  this.visitedPopups = [];
  
  this.map.addControl(new MapboxGl.Navigation({
    'position': 'top-left'
  }));
  
  this.map.on('load', function(){
    onLoad();
    this.addSource("ranks", {
      type: "geojson",
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
    var layers = [
      [0, 'rgba(0,255,0,0.5)', 70],
      [0.05, 'rgba(255,165,0,0.5)', 80],
      [0.1, 'rgba(255,0,0,0.8)', 90]
    ];
    var thatMap = this;
    layers.forEach(function (layer, i) {
      thatMap.addLayer({
        "id": "cluster-" + i,
        "type": "circle",
        "source": 'ranks',
        "paint": {
          "circle-color": layer[1],
          "circle-radius": layer[2],
          "circle-blur": 1
        },
        "filter": i === layers.length - 1 ?
          [">=", "rank", layer[0]] :
          ["all",
            [">=", "rank", layer[0]],
            ["<", "rank", layers[i + 1][0]]]
      });
    });
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

Map.prototype.addPageRank = function(ranks) {
  this.map.getSource('ranks').setData(ranks);
};

Map.prototype.getStops = function(query) {
  return this.stops.features.map((feature) => {
    return { 
      name: feature.properties.name,
      routes: feature.properties.routes,
      id: feature.properties.id
    }; })
    .filter(stop => stop.name.toLowerCase().indexOf(query.toLowerCase()) !== -1)
    .sort((a,b) => {
      if (a.name < b.name)
        return -1;
      if (a.name > b.name)
        return 1;
      return 0; })
    .slice(0,10);
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
  
  $('#sel-stop').html(stops.features[DEFAULT_START].properties.name);
  self.selectedStop = parseInt(stops.features[DEFAULT_START].properties.id);
  
  var popup = new MapboxGl.Popup({
    closeButton: false,
    closeOnClick: false
  });
  this.map.on('mousemove', function(e) {
    var features = self.map.queryRenderedFeatures(e.point, { layers: ['stops'] });
    self.map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
    
    if (!features.length) { popup.remove(); return; }
  
    var feature = features[0];
    var html = feature.properties.name + ' ';
    feature.properties.routes.split(",").forEach(function(route,index) {
      // Only include an image if it isn't one of the routes we don't have images for
      // This could be updated to check for the presence of that file, but this
      // sounds like an unnecessary network bottleneck.
      if (UNINCLUDED_ROUTES.indexOf(route) === -1) {
        html += '<img src="icons/' + route.toLowerCase() + '.png" /> ';
      } else {
        html += '(' + route + ') ';
      }
    });
    
    // Set the popup location and text
    popup.setLngLat(feature.geometry.coordinates)
      .setHTML(html)
      .addTo(self.map); 
  });
  this.map.on('click', function(e) {
    var features = self.map.queryRenderedFeatures(e.point, { layers: ['stops'] });
    if (!features.length) { return; }
    
    var feature = features[0];
    
    $('#sel-stop').html(feature.properties.name);
    self.selectedStop = parseInt(feature.properties.id);
  });
  this.stops = stops;
};

Map.prototype.addEdges = function(edges) {
  let createLayer = function(map, id, data, color, width, opacity) {
    if (map.getSource(id) !== undefined) { map.removeSource(id); }
    if (map.getLayer(id) !== undefined) { map.removeLayer(id); }
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
  
  // Create source and layer for visited (and left) edges to be populated later
  createLayer(this.map, 'visited edges', this.visitedEdges, '#ff0000', 3, 1.0);
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

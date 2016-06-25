(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
$(function() {
  const socketMsg = require('./constants.js');
  var Map = require('./map.js');
  
  var socket = io();
  
  var map = new Map(function() {
    socket.emit(socketMsg.requestStops);
    socket.emit(socketMsg.requestEdges);
  });
  
  socket.on(socketMsg.log, function(msg) {
    console.log(msg);
  });
  
  socket.on(socketMsg.sendStops, function(stopsGeoJson) {
    map.addStops(stopsGeoJson);
  });
  
  socket.on(socketMsg.sendEdges, function(edges) {
    //map.addEdges(edges);
    console.log(edges);
  });
  
  $('#btn-run').on('click', function() {
    socket.emit('start dfs', 'Back atcha!');
  })
});

},{"./constants.js":2,"./map.js":3}],2:[function(require,module,exports){
const socketMsg = {
  log: 'log',
  requestStops: 'request stops',
  sendStops: 'send stops',
  requestEdges: 'request edges',
  sendEdges: 'send edges'
};

Object.freeze(socketMsg);

module.exports = socketMsg;
},{}],3:[function(require,module,exports){
var Map = function(onLoad) {
  var latitude   = 40.72;
  var longitude  = -74.0;
  var zoom_level = 10;
  mapboxgl.accessToken = 'pk.eyJ1IjoiZ3JlZW50IiwiYSI6ImNpazBqdWFsOTM5Nnh2M2x6dWZ2dnB3aHkifQ.97-pFPD8lQf02B6edag1rA';
  map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v9',
      center: [longitude, latitude],
      zoom: zoom_level
  });
  
  map.addControl(new mapboxgl.Navigation({
    'position': 'top-left'
  }));
    
  map.on('load', function(){
    onLoad();
  });
};

Map.prototype.addStops = function(stopsGeoJson) {
  map.addSource('stops', {
    "type": "geojson",
    "data": stopsGeoJson
  });
  
  map.addLayer({
    "id": 'stops',
    "type": "symbol",
    "source": 'stops',
    "layout": {
      "icon-image": "marker-11"
    }
  });
};

Map.prototype.addEdges = function(edges) {
  map.addSource('edges', {
    type: 'geojson',
    data: edges
  });
  map.addLayer({
    id: 'edges',
    type: 'line',
    source: 'edges',
    paint: {
      'line-width': 4,
      'line-color': '#ffffff'
    }
  });
};

module.exports = Map;
},{}]},{},[1]);

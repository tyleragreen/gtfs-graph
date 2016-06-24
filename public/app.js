$(function() {
  var socket = io();
  
  var latitude   = 40.72;
  var longitude  = -74.0;
  var zoom_level = 10;
  mapboxgl.accessToken = 'pk.eyJ1IjoiZ3JlZW50IiwiYSI6ImNpazBqdWFsOTM5Nnh2M2x6dWZ2dnB3aHkifQ.97-pFPD8lQf02B6edag1rA';
  var map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v9',
      center: [longitude, latitude],
      zoom: zoom_level
  });
  
  socket.on('new edge', function(edge) {
    console.log(edge);
  });
  
  map.on('load', function(){
    socket.emit('send stops');
    console.log('map1', map);
  });
  
  socket.on('stops', function(stops) {
    addStop(stops);
  });
  
  var addStop = function(stops_geojson) {
    map.addSource('stops', {
      "type": "geojson",
      "data": stops_geojson
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
  
  $('#btn-run').on('click', function() {
    socket.emit('start dfs', 'Back atcha!');
  })
});

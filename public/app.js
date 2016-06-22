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
  });
  
  socket.on('stops', function(stops) {
    map.addSource('stop', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [stops[0][0], stops[0][1]],
            [0,0]
            ]
        }
      }
    });
    console.log(stops[0]);
    map.addLayer({
      id: 'stop',
      type: 'line',
      source: 'stop',
      paint: {
        'line-color': '#ff0000',
        'line-width': 8
      }
    });
  });
  
  $('#btn-run').on('click', function() {
    socket.emit('start dfs', 'Back atcha!');
  })
});

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

module.exports = Map;
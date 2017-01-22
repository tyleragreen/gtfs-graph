import React, { PropTypes } from 'react';
import DOM from 'react-dom';
import MapboxGl from "mapbox-gl";

const RANKS = 'ranks';
const VISITED = 'visited edges';
const LEFT = 'left edges';
const STOPS = 'stops';
const ROUTES = 'routes';
const TRANSFERS = 'transfers';

export default React.createClass({
  childContextTypes: {
    map: PropTypes.object
  },
  getInitialState: function() {
    return { 
      map: undefined,
      visitedEdges: {
        type: 'FeatureCollection',
        features: []
      },
      leftEdges: {
        type: 'FeatureCollection',
        features: []
      },
      pageRanks: {
        type: 'FeatureCollection',
        features: []
      }
    };
  },
  clearTrace: function() {
    let clearedVisited = {
      type: 'FeatureCollection',
      features: []
    };
    let clearedLeft = {
      type: 'FeatureCollection',
      features: []
    };
    let clearedRanks = {
      type: 'FeatureCollection',
      features: []
    };
    this.setState({
      visitedEdges: clearedVisited,
      leftEdges: clearedLeft,
      pageRanks: clearedRanks
    });
    this.state.map.getSource(VISITED).setData(clearedVisited);
    this.state.map.getSource(LEFT).setData(clearedLeft);
    this.state.map.getSource(RANKS).setData(clearedRanks);
  },
  componentDidMount: function() {
    
    this._preloadImages();
    
    MapboxGl.accessToken = 'pk.eyJ1IjoiZ3JlZW50IiwiYSI6ImNpazBqdWFsOTM5Nnh2M2x6dWZ2dnB3aHkifQ.97-pFPD8lQf02B6edag1rA';
    
    let map = new MapboxGl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v9',
      zoom: 11
    });
    
    //map.addControl(new MapboxGl.Navigation({
    //  'position': 'top-left'
    //}));
    
    map.on('load', () => { this.props.onMapLoad() });
    this.setState({ map: map });
  },
  setCenter: function(lon, lat, zoomLevel) {
    this.state.map.setCenter([lon, lat]);
    this.state.map.setZoom(zoomLevel);
  },
  getMap: function() {
    return this.state.map;
  },
  getChildContext: function() {
    return {
	    map: this.state.map
    };
  },
  _preloadImages: function() {
    // Hack to preload images
    var images = ['1','2','3','4','5','6','6x','7','7x','a','b','c','d','e','f','fs','g','gs','j','l','m','n','q','r','si','z'];
    images.forEach(function(img) {
      var image = new Image();
      image.src = '/files/icons/mta/' + img + '.png';
    });
    var parisImages = ['1','2','3','3b','4','5','6','7','7b','8','9','10','11','12','13','14','15','16','17','18','a','b','c','d','e'];
    parisImages.forEach(function(img) {
      var image = new Image();
      image.src = '/files/icons/ratp/' + img + '.png';
    });
  },
  setZoom: function(newZoomLevel) {
    this.state.map.easeTo({ zoom: newZoomLevel });
    this.setState({ zoomLevel: newZoomLevel });
  },
  panTo: function(stop) {
    this.state.map.easeTo({ center: [ stop.longitude, stop.latitude ] });
  },
  _getStopsAsGeoJson: function(stops, ranks) {
    var stopsGeoJson = [];
    
    for (var stopIndex in stops) {
      let feature = {
        'type': 'Feature',
        'properties': {
          'id': stops[stopIndex].id,
          'name': stops[stopIndex].name,
          'routes': stops[stopIndex].routes
        },
        'geometry': {
          'type': 'Point',
          'coordinates': [stops[stopIndex].longitude, stops[stopIndex].latitude]
        }
      };
      if (ranks) { feature.properties.rank = ranks[stopIndex] }
      stopsGeoJson.push(feature);
    }
    stopsGeoJson = {
      'type': 'FeatureCollection',
      'features': stopsGeoJson
    };
    
    return stopsGeoJson;
  },
  addStops: function(stops) {
    let stopGeoJson = this._getStopsAsGeoJson(stops);
    
    this.state.map.addSource(RANKS, {
      type: "geojson",
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
    this.state.map.addSource(STOPS, {
      "type": "geojson",
      "data": stopGeoJson
    });
    
    this.state.map.addLayer({
      "id": STOPS,
      "type": "symbol",
      "source": STOPS,
      "layout": {
        "icon-image": "marker-11"
      }
    }, ROUTES);
    var self = this;
    
    this.state.map.on('mousemove', function(e) {
      var features = self.state.map.queryRenderedFeatures(e.point, { layers: [STOPS] });
      self.state.map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
      
      if (!features.length) {
        self.props.onStopHover(undefined);
        return;
      }
    
      var feature = features[0];
      
      if (self.props.onStopHover) {
        self.props.onStopHover(feature.properties.id);
      }
    });
    this.state.map.on('click', function(e) {
      var features = self.state.map.queryRenderedFeatures(e.point, { layers: [STOPS] });
      if (!features.length) { return; }
      
      var feature = features[0];
      
      if (self.props.onStopClick) {
        self.props.onStopClick(feature.properties.id);
      }
    });
  },
  showRanks: function(stops,ranks) {
    let stopGeoJson = this._getStopsAsGeoJson(stops,ranks);
    this.addRankLayers(stopGeoJson);
    this.state.map.getSource(STOPS).setData(stopGeoJson);
    this.state.map.getSource(RANKS).setData(stopGeoJson);
  },
  addRankLayers: function(stopGeoJson) {
    const { map } = this.state;
    
    const ranks = stopGeoJson.features.map(stop => stop.properties.rank);
    const min = Math.min(...ranks);
    const max = Math.max(...ranks);
    const range = max - min;
    const firstFifth  = 0.2 * range + min;
    const secondFifth = 0.4 * range + min;
    const thirdFifth  = 0.6 * range + min;
    const fourthFifth = 0.8 * range + min;
    
    const layers = [
      [min, 'rgba(0,255,0,0.8)', 60],
      [firstFifth, 'rgba(0,255,255,0.8)', 60],
      [secondFifth, 'rgba(0,0,255,0.8)', 60],
      [thirdFifth, 'rgba(255,0,255,0.8)', 60],
      [fourthFifth, 'rgba(255,0,0,0.8)', 60]
    ];
    layers.forEach((layer, i) => {
      const layerId = 'cluster-'+i;
      // Remove this layer if it already exists
      if (typeof map.getLayer(layerId) !== "undefined") {
        map.removeLayer(layerId);
      }
      map.addLayer({
        "id": layerId,
        "type": "circle",
        "source": RANKS,
        "paint": {
          "circle-color": layer[1],
          "circle-radius": layer[2],
          "circle-blur": 1
        },
        "filter": i === layers.length - 1 ?
          [">=", "rank", layer[0]] :
          ["all",
            [">=", "rank", layer[0]],
            ["<", "rank", layers[i + 1][0]]
          ]
      }, STOPS);
    });
  },
  addEdges: function(edges) {
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
      
    let transferEdges = edges.features.filter(feature => feature.properties.edgeType.toLowerCase() == 'transfer');
    let routeEdges = edges.features.filter(feature => feature.properties.edgeType.toLowerCase() == 'route');
    createLayer(this.state.map, TRANSFERS, transferEdges, '#708090', 2, 0.7);
    createLayer(this.state.map, ROUTES, routeEdges, '#ffffff', 2, 0.7);
    
    // Create source and layer for visited (and left) edges to be populated later
    createLayer(this.state.map, VISITED, this.state.visitedEdges, '#ff0000', 3, 1.0);
    createLayer(this.state.map, LEFT, this.state.leftEdges, '#0000ff', 3, 1.0);
  },
  visitEdge: function(edge) {
    this.state.visitedEdges.features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
            [ edge.origin.longitude, edge.origin.latitude ],
            [ edge.destination.longitude, edge.destination.latitude ]
          ]
      }
    });
    this.state.map.getSource(VISITED).setData(this.state.visitedEdges);
  },
  leaveEdge: function(edge) {
    this.state.leftEdges.features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
            [ edge.origin.longitude, edge.origin.latitude ],
            [ edge.destination.longitude, edge.destination.latitude ]
          ]
      }
    });
    this.state.map.getSource(LEFT).setData(this.state.leftEdges);
  },
  render: function() {
    const { children } = this.props;

    return (
      <div id='map'>
        { children }
      </div>
    );
  }
});
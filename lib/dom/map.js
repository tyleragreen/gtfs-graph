import DOM, { render, unmountComponentAtNode } from 'react-dom';
import MapboxGl from "mapbox-gl";
import React from 'react';
import RouteList from './route-list';
const socketMsg = require('../constants.js');

export default React.createClass({
  getInitialState: function() {
    return { 
      map: undefined,
      zoomLevel: 10,
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
    this.state.map.getSource('visited edges').setData(clearedVisited);
    this.state.map.getSource('left edges').setData(clearedLeft);
    this.state.map.getSource('ranks').setData(clearedRanks);
  },
  componentDidMount: function() {
    
    this._preloadImages();
    
    const latitude   = 40.75;
    const longitude  = -73.96;
    const zoomLevel = this.state.zoomLevel;
    MapboxGl.accessToken = 'pk.eyJ1IjoiZ3JlZW50IiwiYSI6ImNpazBqdWFsOTM5Nnh2M2x6dWZ2dnB3aHkifQ.97-pFPD8lQf02B6edag1rA';
    var that = this;
    
    let map = new MapboxGl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v9',
        center: [longitude, latitude],
        zoom: zoomLevel
    });
    
    map.addControl(new MapboxGl.Navigation({
      'position': 'top-left'
    }));
    
    map.on('load', function() {
      that.props.onMapLoad();
    });
    this.setState({ map: map });
  },
  _preloadImages: function() {
    // Hack to preload images
    var images = ['1','2','3','4','5','6','6x','7','7x','a','b','c','d','e','f','fs','g','gs','j','l','m','n','q','r','si','z'];
    images.forEach(function(img) {
      var image = new Image();
      image.src = '../files/' + img + '.png';
    });
  },
  setZoom: function(newZoomLevel) {
    this.state.map.easeTo({ zoom: newZoomLevel });
    this.setState({ zoomLevel: newZoomLevel });
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
    
    this.state.map.addSource('stops', {
      "type": "geojson",
      "data": stopGeoJson
    });
    
    this.state.map.addLayer({
      "id": 'stops',
      "type": "symbol",
      "source": 'stops',
      "layout": {
        "icon-image": "marker-11"
      }
    });
    this.state.map.addSource("ranks", {
      type: "geojson",
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
    var layers = [
      [0, 'rgba(0,255,0,0.5)', 70],
      [1.0, 'rgba(255,165,0,0.5)', 80],
      [1.5, 'rgba(255,0,0,0.8)', 90]
    ];
    var thatMap = this.state.map;
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
    var self = this;
    
    this.state.map.on('mousemove', function(e) {
      var features = self.state.map.queryRenderedFeatures(e.point, { layers: ['stops'] });
      self.state.map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
      
      if (!features.length) {
        self.props.onStopHover(undefined);
        return;
      }
    
      var feature = features[0];
      
      self.props.onStopHover(feature.properties.id);
    });
    this.state.map.on('click', function(e) {
      var features = self.state.map.queryRenderedFeatures(e.point, { layers: ['stops'] });
      if (!features.length) { return; }
      
      var feature = features[0];
      
      if (self.props.mode !== socketMsg.dijkstra && self.props.mode !== socketMsg.pageRank) {
        self.props.onEndpointSetById('origin', feature.properties.id);
      }
    });
  },
  onEndpointClick: function(inputField, stop) {
    this.props.onEndpointSet(inputField, stop);
  },
  showRanks: function(stops,ranks) {
    let stopGeoJson = this._getStopsAsGeoJson(stops,ranks);
    this.state.map.getSource('ranks').setData(stopGeoJson);
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
      
    let transferEdges = edges.features.filter(feature => feature.properties.edgeType == 'transfer');
    let routeEdges = edges.features.filter(feature => feature.properties.edgeType == 'route');
    createLayer(this.state.map, 'transfers', transferEdges, '#708090', 2, 0.7);
    createLayer(this.state.map, 'routes', routeEdges, '#ffffff', 2, 0.7);
    
    // Create source and layer for visited (and left) edges to be populated later
    createLayer(this.state.map, 'visited edges', this.state.visitedEdges, '#ff0000', 3, 1.0);
    createLayer(this.state.map, 'left edges', this.state.leftEdges, '#0000ff', 3, 1.0);
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
    this.state.map.getSource('visited edges').setData(this.state.visitedEdges);
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
    this.state.map.getSource('left edges').setData(this.state.leftEdges);
  },
  render: function() {
    const { hoverStop, mode, origin, destination } = this.props;
    
    return (
      <div id='map'>
        { origin && (
          <Popup
            map={this.state.map}
            longitude={origin.longitude}
            latitude={origin.latitude}
            ref={'origin'}
            key={'origin'}
          >
            <div className='popup'>
              <div><b>Origin</b></div>
              <div>{origin.name}</div>
              <div><RouteList stop={origin} /></div>
            </div>
          </Popup>
        )}
        { destination && (
          <Popup
            map={this.state.map}
            longitude={destination.longitude}
            latitude={destination.latitude}
            ref={'destination'}
            key={'destination'}
          >
            <div className='popup'>
              <div><b>Destination</b></div>
              <div>{destination.name}</div>
              <div><RouteList stop={destination} /></div>
            </div>
          </Popup>
        )}
        { hoverStop && mode !== socketMsg.dijkstra && 
          hoverStop != origin && hoverStop != destination &&
          (
          <Popup
            map={this.state.map}
            longitude={hoverStop.longitude}
            latitude={hoverStop.latitude}
            ref={'popup'}
            key={'popup'}
          >
            <div className='popup'>
              <div>{hoverStop.name}</div>
              <div><RouteList stop={hoverStop} /></div>
            </div>
          </Popup>
        )}
        { hoverStop && mode === socketMsg.dijkstra && 
          hoverStop != origin && hoverStop != destination &&
          (
          <Popup
            map={this.state.map}
            longitude={hoverStop.longitude}
            latitude={hoverStop.latitude}
            ref={'popup'}
            key={'popup'}
          >
            <div className='popup'>
              <div>{hoverStop.name}</div>
              <div><RouteList stop={hoverStop} /></div>
              <div>
                <button className='btn btn-primary' onClick={this.onEndpointClick.bind(null,'origin',hoverStop)}>Origin</button>
                <button className='btn btn-primary' onClick={this.onEndpointClick.bind(null,'destination',hoverStop)}>Destination</button>
              </div>
            </div>
          </Popup>
        )}
      </div>
    );
  }
});

var Popup = React.createClass({
  componentDidMount: function() {
    this.div = document.createElement('div');
    this.popup = new MapboxGl.Popup({
      closeButton: false,
      closeOnClick: false
    });
    
    const { longitude, latitude, children, map } = this.props;
    const { popup, div } = this;
    
    popup.setDOMContent(this.div);
    popup.setLngLat([longitude, latitude]);
    render(children, div, () => {
      popup.addTo(map);
    });
  },
  componentDidUpdate: function() {
    const { longitude, latitude, children } = this.props;
    const { popup, div } = this;
    
    popup.setLngLat([longitude, latitude]);
    render(children, div);
  },
  componentWillUnmount: function() {
    this.popup.remove();
    unmountComponentAtNode(this.div);
  },
  render: function() {
    return null;
  }
});
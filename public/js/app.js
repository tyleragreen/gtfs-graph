import React from 'react';
import DOM, { render, unmountComponentAtNode } from 'react-dom';
import IO from 'socket.io-client';
import MapboxGl from "mapbox-gl";

var onClickOutside = require('react-onclickoutside');
const socketMsg = require('./constants.js');
const UNINCLUDED_ROUTES = ["SI"];

var App = React.createClass({
  componentDidMount: function() {
    var socket = IO();
    var that = this;
    
    socket.on(socketMsg.sendStops, function(stops) {
      that.setState({ stops: stops });
      that.refs.map.addStops(stops);
    });
    
    socket.on(socketMsg.sendEdges, function(edges) {
      that.refs.map.addEdges(edges);
    });
    
    socket.on(socketMsg.event, function(event) {
      if (event.type === socketMsg.visitNode) {
        that.refs.map.visitEdge(event.data);
      } else if (event.type === socketMsg.leaveNode) {
        that.refs.map.leaveEdge(event.data);
      } else {
        throw 'bad event type';
      }
    });
    
    this.setState({ socket: socket });
  },
  handleMapLoad: function() {
    this.state.socket.emit(socketMsg.requestStops);
    this.state.socket.emit(socketMsg.requestEdges);
  },
  handleAutocomplete: function(query,numToReturn=10) {
    return this.state.stops.filter(stop => stop.name.toLowerCase().indexOf(query.toLowerCase()) !== -1)
      .sort((a,b) => {
        if (a.name < b.name)
          return -1;
        if (a.name > b.name)
          return 1;
        return 0; })
      .slice(0,numToReturn);
  },
  handleRun: function(mode, origin, destination) {
    var msg = 'start ' + mode;
    this.state.socket.emit(msg, origin, destination);
    this.refs.map.clearTrace();
  },
  handleStopClick: function(stopId) {
    this.refs.menu.setOriginFromClick(this._lookupStop(stopId));
  },
  handleStopHover: function(stopId) {
    this.refs.map.setHoverStop(this._lookupStop(stopId));
  },
  _lookupStop: function(stopId) {
    return this.state.stops[this.state.stops.map(stop => stop.id).indexOf(stopId)];
  },
  render: function() {
    return (
      <div>
        <Map
          onMapLoad={this.handleMapLoad}
          onStopClick={this.handleStopClick}
          onStopHover={this.handleStopHover}
          ref='map'
        />
        <Menu
          onAutocomplete={this.handleAutocomplete}
          onRun={this.handleRun}
          ref='menu'
        />
      </div>
    );
  }
});

var Map = React.createClass({
  getInitialState: function() {
    return { 
      map: undefined,
      popupLatitude: undefined,
      popupLongitude: undefined,
      visitedEdges: {
        type: 'FeatureCollection',
        features: []
      },
      leftEdges: {
        type: 'FeatureCollection',
        features: []
      }
    };
  },
  clearTrace: function() {
    this.setState({
      visitedEdges: {
        type: 'FeatureCollection',
        features: []
      },
      leftEdges: {
        type: 'FeatureCollection',
        features: []
      }
    });
  },
  componentDidMount: function() {
    
    this._preloadImages();
    
    const latitude   = 40.75;
    const longitude  = -73.96;
    const zoom_level = 13;
    MapboxGl.accessToken = 'pk.eyJ1IjoiZ3JlZW50IiwiYSI6ImNpazBqdWFsOTM5Nnh2M2x6dWZ2dnB3aHkifQ.97-pFPD8lQf02B6edag1rA';
    var that = this;
    
    let map = new MapboxGl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v9',
        center: [longitude, latitude],
        zoom: zoom_level
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
      image.src = 'icons/' + img + '.png';
    });
  },
  _getStopsAsGeoJson: function(stops) {
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
      stopsGeoJson.push(feature);
    }
    stopsGeoJson = {
      'type': 'FeatureCollection',
      'features': stopsGeoJson
    };
    
    return stopsGeoJson;
  },
  addStops: function(stops) {
    var stopGeoJson = this._getStopsAsGeoJson(stops);
    
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
    var self = this;
    
    this.state.map.on('mousemove', function(e) {
      var features = self.state.map.queryRenderedFeatures(e.point, { layers: ['stops'] });
      self.state.map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
      
      if (!features.length) { 
        self.setState({ hoveredStop: undefined });
        return;
      }
    
      var feature = features[0];
      let selectedStopId = feature.properties.id;
      self.props.onStopHover(selectedStopId);
    });
    this.state.map.on('click', function(e) {
      var features = self.state.map.queryRenderedFeatures(e.point, { layers: ['stops'] });
      if (!features.length) { return; }
      
      var feature = features[0];
      
      let selectedStopId = feature.properties.id;
      self.props.onStopClick(selectedStopId);
    });
  },
  setHoverStop: function(hoveredStop) {
    this.setState({ hoveredStop: hoveredStop });
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
            [ edge[0].longitude, edge[0].latitude ],
            [ edge[1].longitude, edge[1].latitude ]
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
            [ edge[0].longitude, edge[0].latitude ],
            [ edge[1].longitude, edge[1].latitude ]
          ]
      }
    });
    this.state.map.getSource('left edges').setData(this.state.leftEdges);
  },
  render: function() {
    const { hoveredStop } = this.state;
    return (
      <div id='map'>
        { hoveredStop && (
          <Popup
            map={this.state.map}
            longitude={hoveredStop.longitude}
            latitude={hoveredStop.latitude}
            ref={'popup'}
            key={'popup'}
          >
            <div>
              <div>{hoveredStop.name}</div>
              <div><RouteList stop={hoveredStop} /></div>
            </div>
          </Popup>
        )}
      </div>
    );
  }
});

var Popup = React.createClass({
  getInitialState: function() {
    this.div = document.createElement('div');
    this.popup = new MapboxGl.Popup({
      closeButton: false,
      closeOnClick: false
    });
    return { popup: undefined };
  },
  componentDidMount: function() {
    const { longitude, latitude, children, map } = this.props;
    const { popup, div } = this;
    
    if (children) {
      popup.setDOMContent(this.div);
    }
    popup.setLngLat([longitude, latitude]);
    render(children, div, () => {
      popup.addTo(map);
    });
    this.setState({ popup: popup });
  },
  componentWillUnmount: function() {
    this.state.popup.remove();
    unmountComponentAtNode(this.div);
  },
  render: function() {
    return null;
  }
});

var Menu = React.createClass({
  getInitialState: function() {
    return {
      mode: 'dfs',
      origin: undefined,
      destination: undefined
    };
  },
  handleRun: function() {
    var destinationId = '';
    if (typeof this.state.destination !== "undefined") {
      destinationId = this.state.destination.id;
    }
    this.props.onRun(this.state.mode, this.state.origin.id, destinationId);
  },
  changeMode: function(mode) {
    this.setState({ mode: mode });
  },
  handleAutocomplete: function(query) {
    return this.props.onAutocomplete(query);
  },
  handleEndpointSet: function(inputField, stop) {
    this.state[inputField] = stop;
  },
  setOriginFromClick: function(stop) {
    this.refs.origin.getInstance().setSelectedStop(stop);
    this.state['origin'] = stop;
  },
  render: function() {
    var selectors;
    if (this.state.mode == 'dij') {
      selectors = (
        <div>
        <StopSelector
          onAutocomplete={this.handleAutocomplete}
          onEndpointSet={this.handleEndpointSet}
          label='Origin'
          ref='origin'
        />
        <StopSelector
          onAutocomplete={this.handleAutocomplete}
          onEndpointSet={this.handleEndpointSet}
          label='Destination'
          ref='destinaton'
        />
        </div>
      );
    } else {
      selectors = (
        <div>
        <StopSelector
          onAutocomplete={this.handleAutocomplete}
          onEndpointSet={this.handleEndpointSet}
          label='Origin'
          ref='origin'
        />
        </div>
      );
    }
    return (
      <div id="controlMenu">
        <ModeSelector onModeChange={this.changeMode} />
        {selectors}
        <StartButton onRun={this.handleRun} />
      </div>
    );
  }
});

var StopSelector = onClickOutside(React.createClass({
  handleClickOutside: function() {
    this.setState({
      stops: []
    });
  },
  getInitialState: function() {
    return {
      searchValue: '',
      stops: [],
      selectedStop: undefined
    };
  },
  setSelectedStop: function(selectedStop) {
    this.setState({ selectedStop: selectedStop });
  },
  handleSuggestionClick: function(itemId) {
    let stopFilter = this.state.stops.filter(stop => stop.id === itemId);
    if (stopFilter.length !== 1) { throw 'bad stop selected'; }
    
    let stop = stopFilter[0];
    
    this.setState({
      selectedStop: stop,
      searchValue: stop.name,
      stops: []
    });

    // Let the Menu know what stop was selected
    this.props.onEndpointSet(this.props.label.toLowerCase(), stop);
  },
  handleChange: function(e) {
    this.setState({ searchValue: e.target.value });
    if (e.target.value.length > 0) {
      this.setState({ stops: this.props.onAutocomplete(e.target.value) });
    } else {
      this.setState({ stops: [] });
    }
  },
  handleTokenClose: function(e) {
    // Prevent the token click event from firing
    e.stopPropagation();
    
    this.setState({
      selectedStop: undefined,
      searchValue: "",
      stops: []
    });
  },
  handleTokenClick: function(e) {
    var prevStopName = this.state.selectedStop.name;
    this.setState({
      selectedStop: undefined,
      searchValue: prevStopName,
    });
  },
  render: function() {
    if (typeof this.state.selectedStop !== "undefined") {
      var token = (
        <SearchToken
          stop={this.state.selectedStop}
          onTokenClose={this.handleTokenClose}
          onTokenClick={this.handleTokenClick}
        />
      );
    }
    return (
      <div>
      <div className="input-label">{this.props.label}:&nbsp;</div>
      <div className="input-wrapper">
      <input
        type="search"
        id="origin"
        className="input-field form-control"
        value={this.state.searchValue}
        onChange={this.handleChange}
        onClick={this.handleChange}
        disabled={typeof this.state.selectedStop !== "undefined"}
      />
      {token}
      </div>
      <SearchSuggestionList
        data={this.state.stops}
        onItemClick={this.handleSuggestionClick}
      />
      </div>
    );
  }
}));

var SearchToken = React.createClass({
  render: function() {
    return (
      <div className="input-token" onClick={this.props.onTokenClick}>
        <RouteList stop={this.props.stop} />&nbsp;&nbsp;{this.props.stop.name}
        <div className="input-token-close" onClick={this.props.onTokenClose}>&times;</div>
      </div>
    );
  }
});

var SearchSuggestionList = React.createClass({
  handleItemClick: function(itemId) {
    this.props.onItemClick(itemId);
  },
  render: function() {
    var list;
    
    if (this.props.data.length > 0) {
      var self = this;
      var suggestions = this.props.data.map(function (stop) {
        return (
          <SearchSuggestion
           key={stop.id}
           id={stop.id}
           stop={stop}
           onItemClick={self.handleItemClick}
          />
        );
      });
      list = (<ul id="suggestions">{suggestions}</ul>);
    }
    
    return (
      <div>
        {list}
      </div>
    );
  }
});

var SearchSuggestion = React.createClass({
  handleClick: function() {
    this.props.onItemClick(this.props.id);
  },
  render: function() {
    return (
      <li
        onClick={this.handleClick}
      >
      <RouteList stop={this.props.stop} />&nbsp;&nbsp;{this.props.stop.name}
      </li>
    );
  }
});

var RouteList = React.createClass({
  render: function() {
    var routes = this.props.stop.routes.map(function(route) {
      return (
        <Icon key={route} id={route.toLowerCase()} />
      );
    });
    
    return (
      <span>{routes}</span>
    );
  }
});

var Icon = React.createClass({
  render: function() {
    var filename = 'icons/' + this.props.id + '.png';
    return (
      <img src={filename} />
    );
  }
});

var StartButton = React.createClass({
  handleSubmit: function() {
    this.props.onRun();
  },
  render: function() {
    return (
      <div className='btn-container'>
        <button className='btn btn-primary btn-block' id='btn-run' onClick={this.handleSubmit}>Run!</button>
      </div>
    );
  }
});

var ModeSelector = React.createClass({
  getInitialState: function() {
    return { selectValue: 'dfs' };
  },
  handleChange: function(e) {
    this.setState({ selectValue: e.target.value });
    this.props.onModeChange(e.target.value);
  },
  render: function() {
    return (
      <div>Traversal Type:&nbsp; 
      <select 
        id="type"
        className="form-control"
        value={this.state.selectValue}
        onChange={this.handleChange}
      >
        <option value="dij">Shortest Path Search</option>
        <option value="dfs">Depth-First Search</option>
        <option value="bfs">Breadth-First Search</option>
      </select>
      </div>
    );
  }
});

DOM.render(
  <App />,
  document.getElementById('content')
);

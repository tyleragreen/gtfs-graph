import React from 'react';
import DOM, { render, unmountComponentAtNode } from 'react-dom';
import update from 'react-addons-update';
import IO from 'socket.io-client';
import MapboxGl from "mapbox-gl";
import classNames from 'classnames';

var onClickOutside = require('react-onclickoutside');
const socketMsg = require('./constants.js');
const UNINCLUDED_ROUTES = ["SI"];

var App = React.createClass({
  getInitialState: function() {
    return {
      infoBoxContents: []
    };
  },
  componentDidMount: function() {
    var socket = IO();
    
    socket.on(socketMsg.sendStops, this._socketSendStopsHandler);
    socket.on(socketMsg.sendEdges, this._socketSendEdgesHandler);
    socket.on(socketMsg.event, this._socketEventHandler);
    
    this.setState({ socket: socket });
  },
  _socketSendStopsHandler: function(stops) {
    this.setState({ stops: stops });
    this.refs.map.addStops(stops);
  },
  _socketSendEdgesHandler: function(edges) {
    this.refs.map.addEdges(edges);
  },
  _socketEventHandler: function(event) {
    if (event.type === socketMsg.visitNode) {
      this.refs.map.visitEdge(event.data);
      let newLine = 'Visit ' + event.data.origin.name + ' to ' + event.data.destination.name;
      this.setState({ infoBoxContents: update(this.state.infoBoxContents, {$push: [newLine]}) });
    } else if (event.type === socketMsg.leaveNode) {
      this.refs.map.leaveEdge(event.data);
      let newLine = 'Leave ' + event.data.origin.name + ' to ' + event.data.destination.name;
      this.setState({ infoBoxContents: update(this.state.infoBoxContents, {$push: [newLine]}) });
    } else if (event.type === socketMsg.summary) {
      let newContents = this.state.infoBoxContents.slice();
      newContents.unshift(event.data);
      this.setState({ infoBoxContents: newContents });
      this.refs.infoBox.addContents(newContents);
    } else {
      throw 'bad event type';
    }
  },
  handleMapLoad: function() {
    this.state.socket.emit(socketMsg.requestStops);
    this.state.socket.emit(socketMsg.requestEdges);
  },
  handleAutocomplete: function(query,numToReturn=10) {
    return this.state.stops
      .filter(stop => stop.name.toLowerCase().indexOf(query.toLowerCase()) !== -1)
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
    this._clearTrace();
    this.setState({ infoBoxContents: [] });
    this.refs.infoBox.addContents([]);
  },
  _clearTrace: function() {
    setTimeout(() => { this.refs.map.clearTrace()}, 80);
  },
  handleStop: function() {
    this.state.socket.emit(socketMsg.clearQueue);
    this._clearTrace();
  },
  handleOriginClick: function(stopId) {
    console.log('origin click', stopId);
    this.refs.menu.setOriginFromClick(this._lookupStop(stopId));
  },
  handleDestinationClick: function(stopId) {
    console.log('dest click', stopId);
    this.refs.menu.setDestinationFromClick(this._lookupStop(stopId));
  },
  handleStopHover: function(stopId) {
    this.refs.map.setHoverStop(this._lookupStop(stopId));
  },
  _lookupStop: function(stopId) {
    return this.state.stops[this.state.stops.map(stop => stop.id).indexOf(stopId)];
  },
  getMode: function() {
    return this.refs.menu.state.mode;
  },
  render: function() {
    return (
      <div>
        <Map
          onMapLoad={this.handleMapLoad}
          onOriginClick={this.handleOriginClick}
          onDestinationClick={this.handleDestinationClick}
          onStopHover={this.handleStopHover}
          getMode={this.getMode}
          ref='map'
        />
        <Menu
          onAutocomplete={this.handleAutocomplete}
          onRun={this.handleRun}
          onStop={this.handleStop}
          ref='menu'
        />
        <InfoBox ref='infoBox' />
      </div>
    );
  }
});

var InfoBox = React.createClass({
  getInitialState: function() {
    return { contents: [] };
  },
  addContents: function(contents) {
    this.setState({ contents: contents });
  },
  render: function() {
    var contents = this.state.contents.map((item, index) => {
      return (
        <div key={index}>{item}</div>
      );
    });
    return (
      <div id='info-box' className='box' key='box'>{contents}</div>
    );
  }
});

var Map = React.createClass({
  getInitialState: function() {
    return { 
      map: undefined,
      popupLatitude: undefined,
      popupLongitude: undefined,
      mode: undefined,
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
    let clearedVisited = {
      type: 'FeatureCollection',
      features: []
    };
    let clearedLeft = {
      type: 'FeatureCollection',
      features: []
    };
    this.setState({
      visitedEdges: clearedVisited,
      leftEdges: clearedLeft
    });
    this.state.map.getSource('visited edges').setData(clearedVisited);
    this.state.map.getSource('left edges').setData(clearedLeft);
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
      
      self.setState({ mode: self.props.getMode() });
      self.props.onStopHover(feature.properties.id);
    });
    this.state.map.on('click', function(e) {
      var features = self.state.map.queryRenderedFeatures(e.point, { layers: ['stops'] });
      if (!features.length) { return; }
      
      var feature = features[0];
      
      if (self.props.getMode() !== socketMsg.dijkstra) {
        self.setState({ mode: self.props.getMode() });
        self.props.onOriginClick(feature.properties.id);
      }
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
    const { hoveredStop, mode } = this.state;
    return (
      <div id='map'>
        { hoveredStop && mode !== socketMsg.dijkstra && (
          <Popup
            map={this.state.map}
            longitude={hoveredStop.longitude}
            latitude={hoveredStop.latitude}
            ref={'popup'}
            key={'popup'}
          >
            <div className='popup'>
              <div>{hoveredStop.name}</div>
              <div><RouteList stop={hoveredStop} /></div>
            </div>
          </Popup>
        )}
        { hoveredStop && mode === socketMsg.dijkstra && (
          <Popup
            map={this.state.map}
            longitude={hoveredStop.longitude}
            latitude={hoveredStop.latitude}
            ref={'popup'}
            key={'popup'}
          >
            <div className='popup'>
              <div>{hoveredStop.name}</div>
              <div><RouteList stop={hoveredStop} /></div>
              <div>
                <button className='btn btn-primary' onClick={this.props.onOriginClick.bind(null,hoveredStop.id)}>Origin</button>
                <button className='btn btn-primary' onClick={this.props.onDestinationClick.bind(null,hoveredStop.id)}>Destination</button>
              </div>
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
    if (this.state.mode === socketMsg.dijkstra) {
      let originInvalid = typeof this.state.origin === "undefined";
      let destinationInvalid = typeof this.state.destination === "undefined";
      
      if (originInvalid) {
        this.refs.origin.getInstance().markInvalid();
      }
      if (destinationInvalid) {
        this.refs.destination.getInstance().markInvalid();
      }
      if (!originInvalid && !destinationInvalid) {
        this.props.onRun(this.state.mode, this.state.origin.id, this.state.destination.id);
      }
    } else {
      if (typeof this.state.origin === "undefined") {
        this.refs.origin.getInstance().markInvalid();
      } else {
        this.props.onRun(this.state.mode, this.state.origin.id);
      }
    }
  },
  handleStop: function() {
    this.props.onStop();
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
  handleEndpointClear: function(inputField) {
    this.state[inputField] = undefined;
  },
  setOriginFromClick: function(stop) {
    this.refs.origin.getInstance().setSelectedStop(stop);
    this.state['origin'] = stop;
  },
  setDestinationFromClick: function(stop) {
    this.refs.destination.getInstance().setSelectedStop(stop);
    this.state['destination'] = stop;
  },
  render: function() {
    var selectors;
    if (this.state.mode === socketMsg.dijkstra) {
      selectors = (
        <div>
        <StopSelector
          onAutocomplete={this.handleAutocomplete}
          onEndpointSet={this.handleEndpointSet}
          onEndpointClear={this.handleEndpointClear}
          label='Origin'
          ref='origin'
        />
        <StopSelector
          onAutocomplete={this.handleAutocomplete}
          onEndpointSet={this.handleEndpointSet}
          onEndpointClear={this.handleEndpointClear}
          label='Destination'
          ref='destination'
        />
        </div>
      );
    } else {
      selectors = (
        <div>
        <StopSelector
          onAutocomplete={this.handleAutocomplete}
          onEndpointSet={this.handleEndpointSet}
          onEndpointClear={this.handleEndpointClear}
          label='Origin'
          ref='origin'
        />
        </div>
      );
    }
    return (
      <div id="controlMenu" className='box'>
        <ModeSelector onModeChange={this.changeMode} />
        {selectors}
        <Button label='Run!' onClick={this.handleRun} key='run' />
        <Button label='Stop' onClick={this.handleStop} key='stop' />
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
      selectedStop: undefined,
      valid: true
    };
  },
  markInvalid: function() {
    this.setState({ valid: false });
  },
  markValid: function() {
    this.setState({ valid: true });
  },
  setSelectedStop: function(selectedStop) {
    this.setState({ selectedStop: selectedStop });
    this.setState({ valid: true });
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
    this.setState({ searchValue: e.target.value, valid: true });
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
    this.props.onEndpointClear(this.props.label.toLowerCase());
  },
  handleTokenClick: function(e) {
    var prevStopName = this.state.selectedStop.name;
    this.setState({
      selectedStop: undefined,
      searchValue: prevStopName,
    });
  },
  render: function() {
    let inputFieldClasses = classNames({
      'input-field': true,
      'form-control': true,
      'form-control-danger': !this.state.valid
    });
    let inputWrapperClasses = classNames({
      'input-wrapper': true,
      'form-group': true,
      'has-danger': !this.state.valid
    });
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
      <div className={inputWrapperClasses}>
      <input
        type="search"
        id="origin"
        className={inputFieldClasses}
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

var Button = React.createClass({
  render: function() {
    return (
      <div className='btn-container'>
        <button className='btn btn-primary btn-block' onClick={this.props.onClick}>{this.props.label}</button>
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
        <option value={socketMsg.dijkstra}>Shortest Path Search</option>
        <option value={socketMsg.dfs}>Depth-First Search</option>
        <option value={socketMsg.bfs}>Breadth-First Search</option>
      </select>
      </div>
    );
  }
});

DOM.render(
  <App />,
  document.getElementById('content')
);

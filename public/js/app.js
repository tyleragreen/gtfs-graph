import React from 'react';
import DOM from 'react-dom';
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
  handleAutocomplete: function(query) {
    return this.refs.map.getStops(query);
  },
  handleRun: function(mode, origin, destination) {
    var msg = 'start ' + mode;
    this.state.socket.emit(msg, origin, destination);
  },
  render: function() {
    return (
      <div>
        <Map onMapLoad={this.handleMapLoad} ref='map' />
        <Menu
          onAutocomplete={this.handleAutocomplete}
          onRun={this.handleRun}
        />
      </div>
    );
  }
});

var Map = React.createClass({
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
      }
    };
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
    //  this.addSource("ranks", {
    //    type: "geojson",
    //    data: {
    //      type: 'FeatureCollection',
    //      features: []
    //    }
    //  });
    //  var layers = [
    //    [0, 'rgba(0,255,0,0.5)', 70],
    //    [0.05, 'rgba(255,165,0,0.5)', 80],
    //    [0.1, 'rgba(255,0,0,0.8)', 90]
    //  ];
    //  var thatMap = this;
    //  layers.forEach(function (layer, i) {
    //    thatMap.addLayer({
    //      "id": "cluster-" + i,
    //      "type": "circle",
    //      "source": 'ranks',
    //      "paint": {
    //        "circle-color": layer[1],
    //        "circle-radius": layer[2],
    //        "circle-blur": 1
    //      },
    //      "filter": i === layers.length - 1 ?
    //        [">=", "rank", layer[0]] :
    //        ["all",
    //          [">=", "rank", layer[0]],
    //          ["<", "rank", layers[i + 1][0]]]
    //    });
    //  });
    //});
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
  getStops: function(query) {
    return this.state.stops.features.map((feature) => {
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
  },
  addStops: function(stops) {
    this.setState({ stops: stops });
    
    this.state.map.addSource('stops', {
      "type": "geojson",
      "data": stops
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
    
    //$('#sel-stop').html(stops.features[DEFAULT_START].properties.name);
    //self.selectedStop = parseInt(stops.features[DEFAULT_START].properties.id);
    
    var popup = new MapboxGl.Popup({
      closeButton: false,
      closeOnClick: false
    });
    this.state.map.on('mousemove', function(e) {
      var features = self.state.map.queryRenderedFeatures(e.point, { layers: ['stops'] });
      self.state.map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
      
      if (!features.length) { popup.remove(); return; }
    
      var feature = features[0];
      var html = feature.properties.name + ' ';
      feature.properties.routes.split(",").forEach(function(route,index) {
        // Only include an image if it isn't one of the routes we don't have images for
        if (UNINCLUDED_ROUTES.indexOf(route) === -1) {
          html += '<img src="icons/' + route.toLowerCase() + '.png" /> ';
        } else {
          html += '(' + route + ') ';
        }
      });
      
      // Set the popup location and text
      popup.setLngLat(feature.geometry.coordinates)
        .setHTML(html)
        .addTo(self.state.map); 
    });
    //this.state.map.on('click', function(e) {
    //  var features = self.state.map.queryRenderedFeatures(e.point, { layers: ['stops'] });
    //  if (!features.length) { return; }
    //  
    //  var feature = features[0];
    //  
    //  self.selectedStop = parseInt(feature.properties.id);
    //});
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
    return (
      <div id='map'></div>
    );
  }
});

var Menu = React.createClass({
  getInitialState: function() {
    return {
      mode: 'dfs',
      origin: '',
      destination: ''
    };
  },
  handleRun: function() {
    this.props.onRun(this.state.mode, this.state.origin.id, this.state.destination.id);
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
  render: function() {
    var selectors;
    if (this.state.mode == 'dij') {
      selectors = (
        <div>
        <StopSelector
          onAutocomplete={this.handleAutocomplete}
          onEndpointSet={this.handleEndpointSet}
          label={'Origin'}
        />
        <StopSelector
          onAutocomplete={this.handleAutocomplete}
          onEndpointSet={this.handleEndpointSet}
          label={'Destination'}
        />
        </div>
      );
    } else {
      selectors = (
        <div>
        <StopSelector onAutocomplete={this.handleAutocomplete} onEndpointSet={this.handleEndpointSet} label={'Origin'} />
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
    var routes = this.props.stop.routes.map(function(route) {
      return (
        <Icon key={route} id={route.toLowerCase()} />
      );
    });
    return (
      <div className="input-token" onClick={this.props.onTokenClick}>{routes}&nbsp;&nbsp;{this.props.stop.name}
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
           name={stop.name}
           routes={stop.routes}
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
    var routes = this.props.routes.map(function(route) {
      return (
        <Icon key={route} id={route.toLowerCase()} />
      );
    });
    
    return (
      <li
        onClick={this.handleClick}
      >
      {routes}&nbsp;&nbsp;{this.props.name}
      </li>
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
        <option value="pr">Page Rank</option>
      </select>
      </div>
    );
  }
});

DOM.render(
  //<Menu socket={socket} />,
  <App />,
  document.getElementById('content')
);

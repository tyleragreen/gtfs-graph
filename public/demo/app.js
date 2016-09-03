import React from 'react';
import DOM from 'react-dom';
import update from 'react-addons-update';
import IO from 'socket.io-client';
import classNames from 'classnames';
import { Map, RouteList, Popup } from '../../lib/dom/index';
import socketMsg from '../../lib/constants.js';
import Systems from '../../lib/systems.js';

var onClickOutside = require('react-onclickoutside');

var App = React.createClass({
  getInitialState: function() {
    this.system = 'MTA';
    return {
      infoBoxContents: [],
      stops: undefined,
      mergedStops: undefined,
      mode: socketMsg.dijkstra,
      origin: undefined,
      destination: undefined,
      hoverStop: undefined
    };
  },
  componentDidMount: function() {
    var socket = IO();
    
    socket.on(socketMsg.sendStops, this._socketSendStopsHandler);
    socket.on(socketMsg.sendEdges, this._socketSendEdgesHandler);
    socket.on(socketMsg.sendMergedStops, this._socketSendMergedStopsHandler);
    socket.on(socketMsg.event, this._socketEventHandler);
    
    this.setState({ socket: socket });
  },
  _socketSendStopsHandler: function(stops) {
    this.setState({ stops: stops });
    this.refs.map.addStops(stops);
  },
  _socketSendMergedStopsHandler: function(mergedStops) {
    this.setState({ mergedStops: mergedStops });
  },
  _socketSendEdgesHandler: function(edges) {
    this.refs.map.addEdges(edges);
  },
  _socketEventHandler: function(event) {
    if (event.type === socketMsg.visitNode) {
      this.refs.map.visitEdge(event.data);
      let newLine = event.data.origin.name + ' to ' + event.data.destination.name;
      this.setState({ infoBoxContents: update(this.state.infoBoxContents, {$push: [newLine]}) });
    } else if (event.type === socketMsg.leaveNode) {
      this.refs.map.leaveEdge(event.data);
      let newLine = 'Leave ' + event.data.origin.name + ' to ' + event.data.destination.name;
      this.setState({ infoBoxContents: update(this.state.infoBoxContents, {$push: [newLine]}) });
    } else if (event.type === socketMsg.showRanks) {
      this.setState({ infoBoxContents: this._orderStopsByRank(event.data) });
      this.refs.map.showRanks(this.state.mergedStops,event.data);
    } else if (event.type === socketMsg.summary) {
      let summaryMsg = this._parseSummaryMessage(event.data);
      let newContents = this.state.infoBoxContents.slice();
      newContents.unshift(summaryMsg);
      this.setState({ infoBoxContents: newContents });
      this.setState({ infoBoxSnapshot: newContents });
    } else {
      throw 'bad event type';
    }
  },
  _orderStopsByRank: function(ranks) {
    let stopsWithRanks = [];
    let stops = this.state.mergedStops;
    ranks.forEach(function(rank, node) {
      let stop = stops[node];
      stop.rank = rank;
      stopsWithRanks.push(stop);
    });
    return stopsWithRanks.sort((a,b) => {
      if (a.rank < b.rank)
        return 1;
      if (a.rank > b.rank)
        return -1;
      return 0;
    })
    .map(stop => {
      return stop.name + ': ' + stop.rank;
    });
  },
  _parseSummaryMessage: function(summary) {
    var summaryMsg;
    if (summary.hasOwnProperty('pathLength')) {
      let hours = Math.floor(summary.pathLength / 3600);
      let minutes = Math.floor((summary.pathLength % 3600) / 60);
      summaryMsg = 'Duration: ';
      if (hours === 1) {
        summaryMsg += hours + ' hour, ' + minutes + ' minutes';
      } else if (hours > 1) {
        summaryMsg += hours + ' hours, ' + minutes + ' minutes';
      } else if (hours === 0 && minutes !== 0) {
        summaryMsg += minutes + ' minutes';
      } else if (hours === 0 && minutes === 0) {
        summaryMsg = 'No path!';
      } else {
        throw 'bad data';
      }
    } else if (summary.hasOwnProperty('stationsVisited')) {
      summaryMsg = 'Stations Visited: ' + summary.stationsVisited;
    } else if (summary.hasOwnProperty('ranks')) {
      summaryMsg = 'Sorted Page Rank:';
    } else {
      throw 'bad summary message';
    }
    return summaryMsg;
  },
  handleMapLoad: function() {
    this.state.socket.emit(socketMsg.requestStops, socketMsg.MTA);
    this.state.socket.emit(socketMsg.requestEdges, socketMsg.MTA);
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
    this.state.socket.emit(msg, this.system, origin, destination);
    this._clearTrace();
    this.setState({ infoBoxContents: [] });
  },
  _clearTrace: function() {
    setTimeout(() => { this.refs.map.clearTrace()}, 80);
  },
  handleStop: function() {
    this.state.socket.emit(socketMsg.clearQueue);
    this._clearTrace();
  },
  _handleStopHover: function(stopId) {
    if (typeof stopId === "undefined") {
      this.setState({ hoverStop: undefined });
    } else {
      this.setState({ hoverStop: this._lookupStop(stopId) });
    }
  },
  _handleStopClick: function(stopId) {
    if (this.state.mode !== socketMsg.dijkstra && this.state.mode !== socketMsg.pageRank) {
      this.handleEndpointSetById('origin', stopId);
    }
  },
  handleEndpointSetById: function(inputField, stopId) {
    this.handleEndpointSet(inputField, this._lookupStop(stopId));
  },
  handleEndpointSet: function(inputField, stop) {
    this.setState({ infoBoxSnapshot: undefined });
    this.setState({ [inputField]: stop });
  },
  _lookupStop: function(stopId) {
    return this.state.stops[this.state.stops.map(stop => stop.id).indexOf(stopId)];
  },
  _handleModeChange: function(mode) {
    this.setState({ infoBoxSnapshot: undefined });
    this.setState({ mode: mode });
  },
  render: function() {
    const { hoverStop, mode, origin, destination } = this.state;
    
    return (
      <div>
        <Map
          latitude={Systems.MTA.latitude}
          longitude={Systems.MTA.longitude}
          zoomLevel={11}
          onMapLoad={this.handleMapLoad}
          onStopHover={this._handleStopHover}
          onStopClick={this._handleStopClick}
          ref='map'
        >
        { origin && (
          <Popup
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
            longitude={hoverStop.longitude}
            latitude={hoverStop.latitude}
            ref={'popup'}
            key={'popup'}
          >
            <div className='popup'>
              <div>{hoverStop.name}</div>
              <div><RouteList stop={hoverStop} /></div>
              <div>
                <button className='btn btn-primary' onClick={this.handleEndpointSet.bind(null,'origin',hoverStop)}>Origin</button>
                <button className='btn btn-primary' onClick={this.handleEndpointSet.bind(null,'destination',hoverStop)}>Destination</button>
              </div>
            </div>
          </Popup>
        )}
        </Map>
        <Menu
          onAutocomplete={this.handleAutocomplete}
          onEndpointSet={this.handleEndpointSet}
          onModeChange={this._handleModeChange}
          onRun={this.handleRun}
          onStop={this.handleStop}
          zoomIn={this._handleZoomIn}
          zoomOut={this._handleZoomOut}
          mode={this.state.mode}
          origin={this.state.origin}
          destination={this.state.destination}
          infoBoxContents={this.state.infoBoxSnapshot}
          ref='menu'
        />
      </div>
    );
  }
});

var Menu = React.createClass({
  _handleRun: function() {
    if (this.props.mode === socketMsg.dijkstra) {
      let originInvalid = typeof this.props.origin === "undefined";
      let destinationInvalid = typeof this.props.destination === "undefined";
      
      if (originInvalid) {
        this.refs.origin.getInstance().markInvalid();
      }
      if (destinationInvalid) {
        this.refs.destination.getInstance().markInvalid();
      }
      if (!originInvalid && !destinationInvalid) {
        this.props.onRun(this.props.mode, this.props.origin.id, this.props.destination.id);
      }
    } else if (this.props.mode === socketMsg.dfs || this.props.mode === socketMsg.bfs) {
      if (typeof this.props.origin === "undefined") {
        this.refs.origin.getInstance().markInvalid();
      } else {
        this.props.onRun(this.props.mode, this.props.origin.id);
      }
    } else {
      this.props.onRun(this.props.mode);
    }
  },
  _handleStop: function() {
    this.props.onStop();
  },
  _handleModeChange: function(mode) {
    //if (mode === socketMsg.dfs || mode === socketMsg.bfs) {
    //  this.props.zoomOut();
    //} else {
    //  this.props.zoomIn();
    //}
    this.props.onModeChange(mode);
  },
  handleAutocomplete: function(query) {
    return this.props.onAutocomplete(query);
  },
  handleEndpointSet: function(inputField, stop) {
    this.props.onEndpointSet(inputField, stop);
  },
  handleEndpointClear: function(inputField) {
    this.props.onEndpointSet(inputField, undefined);
  },
  render: function() {
    var selectors;
    if (this.props.mode === socketMsg.dijkstra) {
      selectors = (
        <div>
        <StopSelector
          onAutocomplete={this.handleAutocomplete}
          onEndpointSet={this.handleEndpointSet}
          onEndpointClear={this.handleEndpointClear}
          selectedStop={this.props.origin}
          label='Origin'
          ref='origin'
        />
        <StopSelector
          onAutocomplete={this.handleAutocomplete}
          onEndpointSet={this.handleEndpointSet}
          onEndpointClear={this.handleEndpointClear}
          selectedStop={this.props.destination}
          label='Destination'
          ref='destination'
        />
        </div>
      );
    } else if (this.props.mode === socketMsg.dfs || this.props.mode === socketMsg.bfs) {
      selectors = (
        <div>
        <StopSelector
          onAutocomplete={this.handleAutocomplete}
          onEndpointSet={this.handleEndpointSet}
          onEndpointClear={this.handleEndpointClear}
          selectedStop={this.props.origin}
          label='Origin'
          ref='origin'
        />
        </div>
      );
    }
    const { infoBoxContents, mode } = this.props;
    let showInfoBox = infoBoxContents; //.length > 0;
    let menuClasses = classNames({
      'box': true,
      'with-info': showInfoBox
    });
    let wrapperClass = classNames({
      'top-menu-wrapper': true,
      'hidden': showInfoBox
    });

    return (
      <div id="controlMenu" className={menuClasses}>
        <div className={wrapperClass}>
        <ModeSelector
         mode={mode}
         onModeChange={this._handleModeChange}
        />
        {selectors}
        <Button label='Run!' onClick={this._handleRun} key='run' />
        <Button label='Stop' onClick={this._handleStop} key='stop' />
        {showInfoBox && 
          (<div className='info-wrapper'>
          <InfoBox ref='infoBox' contents={infoBoxContents} />
          </div>)
        }
        </div>
      </div>
    );
  }
});

var InfoBox = React.createClass({
  render: function() {
    var contents = this.props.contents.map((item, index) => {
      return (
        <div className='info-row' key={index}>{item}</div>
      );
    });
    return (
      <div id='info-box' className='box' key='box'>{contents}</div>
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
    this.setState({ valid: true });
  },
  handleSuggestionClick: function(itemId) {
    let stopFilter = this.state.stops.filter(stop => stop.id === itemId);
    if (stopFilter.length !== 1) { throw 'bad stop selected'; }
    
    let stop = stopFilter[0];
    
    this.setState({
      searchValue: stop.name,
      stops: []
    });

    // Let the Menu know what stop was selected
    this.props.onEndpointSet(this.props.label.toLowerCase(), stop);
  },
  handleChange: function(e) {
    this.setState({
      searchValue: e.target.value,
      valid: true,
      stops: this.props.onAutocomplete(e.target.value)
    });
  },
  handleTokenClose: function(e) {
    // Prevent the token click event from firing
    e.stopPropagation();
    
    this.setState({
      searchValue: "",
      stops: []
    });
    this.props.onEndpointClear(this.props.label.toLowerCase());
  },
  handleTokenClick: function(e) {
    var prevStopName = this.props.selectedStop.name;
    this.setState({
      searchValue: prevStopName,
    });
    this.props.onEndpointClear(this.props.label.toLowerCase());
  },
  componentWillUnmount: function() {
    this.props.onEndpointClear(this.props.label.toLowerCase());
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
    if (typeof this.props.selectedStop !== "undefined") {
      var token = (
        <SearchToken
          stop={this.props.selectedStop}
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
  _handleChange: function(e) {
    this.props.onModeChange(e.target.value);
  },
  render: function() {
    return (
      <div>Traversal Type:&nbsp; 
      <select 
        id="type"
        className="form-control"
        value={this.props.mode}
        onChange={this._handleChange}
      >
        <option value={socketMsg.dijkstra}>Shortest Path Search</option>
        <option value={socketMsg.dfs}>Depth-First Search</option>
        <option value={socketMsg.bfs}>Breadth-First Search</option>
        <option value={socketMsg.pageRank}>Page Rank</option>
      </select>
      </div>
    );
  }
});

DOM.render(
  <App />,
  document.getElementById('content')
);

import React, { Component } from 'react';
import DOM from 'react-dom';
import IO from 'socket.io-client';

var onClickOutside = require('react-onclickoutside');
const socketMsg = require('./constants.js');
var Map = require('./map.js');

var socket = IO();

var map = new Map(function() {
  socket.emit(socketMsg.requestStops);
  socket.emit(socketMsg.requestEdges);
});

socket.on(socketMsg.log, function(msg) {
  console.log(msg);
});

socket.on(socketMsg.sendStops, function(stops) {
  map.addStops(stops);
});

socket.on(socketMsg.sendEdges, function(edges) {
  map.addEdges(edges);
});

socket.on(socketMsg.sendPR, function(ranks) {
  map.addPageRank(ranks);
});

socket.on(socketMsg.event, function(event) {
  if (event.type === socketMsg.visitNode) {
    map.visitEdge(event.data);
  } else if (event.type === socketMsg.leaveNode) {
    map.leaveEdge(event.data);
  } else {
    throw 'bad event type';
  }
});

var Menu = React.createClass({
  getInitialState: function() {
    return { mode: 'dfs' };
  },
  runMode: function() {
    var msg = 'start ' + this.state.mode;
    this.props.socket.emit(msg, map.selectedStop);
  },
  changeMode: function(mode) {
    this.setState({ mode: mode });
  },
  render: function() {
    return (
      <div id="controlMenu">
        <ModeSelector onModeChange={this.changeMode} />
        <StopSelector />
        <StartButton onRun={this.runMode} />
      </div>
    );
  }
});

var StopSelector = onClickOutside(React.createClass({
  handleClickOutside: function() {
    console.log('outside click');
    this.setState({
      stops: []
    });
  },
  getInitialState: function() {
    return {
      searchValue: '',
      stops: []
    };
  },
  handleSuggestionClick: function(itemId) {
    var selectedStop = this.state.stops.filter(stop => stop.id === itemId);
    if (selectedStop.length !== 1) { throw 'bad stop selected'; }
    this.setState({
      selectedStop: selectedStop[0],
      searchValue: selectedStop[0].name,
      stops: []
    });
  },
  handleChange: function(e) {
    this.setState({ searchValue: e.target.value });
    if (e.target.value.length > 0) {
      this.setState({ stops: map.getStops(e.target.value) });
    } else {
      this.setState({ stops: [] });
    }
  },
  render: function() {
    return (
      <div>
      <input
        type="text"
        id="origin"
        value={this.state.searchValue}
        onChange={this.handleChange}
        onClick={this.handleChange}
      />
      <SearchSuggestionList
        data={this.state.stops}
        onItemClick={this.handleSuggestionClick}
      />
      </div>
    );
  }
}));

var SearchSuggestionList = React.createClass({
  handleItemClick: function(itemId) {
    console.log('search sugg list', itemId);
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
    console.log('search sugg', this.props.id);
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
      {routes}{this.props.name}
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
      <button id='btn-run' onClick={this.handleSubmit}>Run!</button>
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
      <div>Traversal Type: 
      <select 
        id="type"
        value={this.state.selectValue}
        onChange={this.handleChange}
      >
        <option value="dfs">Depth-First Search</option>
        <option value="bfs">Breadth-First Search</option>
        <option value="pr">Page Rank</option>
      </select>
      </div>
    );
  }
});

DOM.render(
  <Menu socket={socket} />,
  document.getElementById('content')
);
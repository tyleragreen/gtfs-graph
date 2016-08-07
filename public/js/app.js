import React, { Component } from 'react';
import DOM from 'react-dom';
import IO from 'socket.io-client';

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
  console.log(event);
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
    return { mode: '' };
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

var StopSelector = React.createClass({
  getInitialState: function() {
    return {
      searchValue: '',
      stops: []
    };
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
      />
      <SearchSuggestionList data={this.state.stops} />
      </div>
    );
  }
});

var SearchSuggestionList = React.createClass({
  render: function() {
    var list;
    
    if (this.props.data.length > 0) {
      var suggestions = this.props.data.map(function (stop) {
        return (
          <SearchSuggestion key={stop.id} name={stop.name} routes={stop.routes} />
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
  render: function() {
    var routes = this.props.routes.map(function(route) {
      return (
        <Icon key={route} id={route.toLowerCase()} />
      );
    });
    
    return (
      <li>{routes}{this.props.name}</li>
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
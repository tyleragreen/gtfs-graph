import React from 'react';
import DOM from 'react-dom';
const socketMsg = require('./constants.js');
var Map = require('./map.js');

var socket = io();

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
    console.log('menu says hello');
    var msg = 'start ' + $('#type').val();
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
  handleChange: function(e) {
    console.log('key press');
  },
  render: function() {
    return (
      <div>
      <input type="text" id="origin"
        onChange={this.handleChange}
      />
      <ul id="suggestions">
      </ul>
      </div>
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
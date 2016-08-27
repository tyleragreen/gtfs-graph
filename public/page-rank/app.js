import React from 'react';
import DOM from 'react-dom';
import update from 'react-addons-update';
import IO from 'socket.io-client';
import { Map, RouteList, Popup } from '../../lib/dom/index';
const socketMsg = require('../../lib/constants.js');

var PageRankDisplay = React.createClass({
  getInitialState: function() {
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
    this.state.socket.emit(socketMsg.requestStops);
    this.state.socket.emit(socketMsg.requestEdges);
    this.state.socket.emit(socketMsg.startPR);
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
  handleStopHover: function(stopId) {
    if (typeof stopId === "undefined") {
      this.setState({ hoverStop: undefined });
    } else {
      this.setState({ hoverStop: this._lookupStop(stopId) });
    }
  },
  _lookupStop: function(stopId) {
    return this.state.stops[this.state.stops.map(stop => stop.id).indexOf(stopId)];
  },
  render: function() {
    const { hoverStop } = this.state;
    return (
      <div>
        <Map
          onMapLoad={this.handleMapLoad}
          onStopHover={this.handleStopHover}
          ref='map'
        >
        { hoverStop && (
          <Popup
            longitude={hoverStop.longitude}
            latitude={hoverStop.latitude}
          >
            <div className='popup'>
              <div>{hoverStop.name}</div>
              <div><RouteList stop={hoverStop} /></div>
            </div>
          </Popup>
        )}
        </Map>
      </div>
    );
  }
});

DOM.render(
  <PageRankDisplay />,
  document.getElementById('content')
);

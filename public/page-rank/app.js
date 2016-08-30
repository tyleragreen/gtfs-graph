import React from 'react';
import DOM from 'react-dom';
import IO from 'socket.io-client';
import { Map, RouteList, Popup } from '../../lib/dom/index';
import socketMsg from '../../lib/constants.js';
import Systems from '../../lib/systems.js';

var PageRankDisplay = React.createClass({
  getInitialState: function() {
    return {
      infoBoxContents: [],
      stops: undefined,
      mergedStops: undefined,
      system: socketMsg.MTA,
      hoverStop: undefined
    };
  },
  componentDidMount: function() {
    var socket = IO();
    
    console.log('requested system');
    socket.emit(socketMsg.requestSystem, this.state.system);
    socket.on(socketMsg.sendSystem, this._socketSendSystemHandler);
    
    socket.on(socketMsg.sendStops, this._socketSendStopsHandler);
    socket.on(socketMsg.sendMergedEdges, this._socketSendEdgesHandler);
    socket.on(socketMsg.sendMergedStops, this._socketSendMergedStopsHandler);
    socket.on(socketMsg.event, this._socketEventHandler);
    
    this.setState({ socket: socket });
  },
  _socketSendSystemHandler: function(system) {
    console.log('received system', system);
    this.setState({ latitude: system.latitude, longitude: system.longitude });
  },
  _socketSendStopsHandler: function(stops) {
    this.setState({ stops: stops });
  },
  _socketSendMergedStopsHandler: function(mergedStops) {
    this.setState({ mergedStops: mergedStops });
    this.refs.map.addStops(mergedStops);
  },
  _socketSendEdgesHandler: function(edges) {
    this.refs.map.addEdges(edges);
  },
  _socketEventHandler: function(event) {
    if (event.type === socketMsg.showRanks) {
      this.setState({ infoBoxContents: this._orderStopsByRank(event.data) });
      this.refs.map.showRanks(this.state.mergedStops,event.data);
    }
  },
  _orderStopsByRank: function(ranks) {
    let stopsWithRanks = [];
    let stops = this.state.mergedStops;
    ranks.forEach(function(rank, node) {
      let stop = stops[node];
      stop.rank = Math.round(rank * 100) / 100;
      stopsWithRanks.push(stop);
    });
    return stopsWithRanks.sort((a,b) => {
      if (a.rank < b.rank)
        return 1;
      if (a.rank > b.rank)
        return -1;
      return 0;
    })
    /*.map(stop => {
      return stop.name + ': ' + stop.rank;
    })*/;
  },
  handleMapLoad: function() {
    this.state.socket.emit(socketMsg.requestStops, this.state.system);
    this.state.socket.emit(socketMsg.requestMergedEdges, this.state.system);
    this.state.socket.emit(socketMsg.startPR);
  },
  handleStopHover: function(stopId) {
    if (typeof stopId === "undefined") {
      this.setState({ hoverStop: undefined });
    } else {
      this.setState({ hoverStop: this._lookupStop(stopId) });
    }
  },
  _lookupStop: function(stopId) {
    return this.state.mergedStops[this.state.mergedStops.map(stop => stop.id).indexOf(stopId)];
  },
  render: function() {
    const { hoverStop } = this.state;
    var self = this;
    
    let ranks = this.state.infoBoxContents.map(function(stop) {
      return (
        <div key={stop.id}>
          <div className='clear-right'>{self.state.infoBoxContents.indexOf(stop)+1}. <b>{stop.rank}</b><span className='float-right'>{stop.name}</span></div>
          <div className='float-right'><RouteList stop={stop} key={stop.id} /></div>
        </div>
      );
    });
    
    return (
      <div>
        <Map
          latitude={this.state.latitude}
          longitude={this.state.longitude}
          zoomLevel={13}
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
              <div><em>{hoverStop.name}</em></div>
              <div>Page Rank: {hoverStop.rank}</div>
              <div>Rank: {this.state.infoBoxContents.indexOf(hoverStop)+1} of {this.state.infoBoxContents.length}</div>
              <div><RouteList stop={hoverStop} /></div>
            </div>
          </Popup>
        )}
        </Map>
        <div className='side-panel'>
          <h2>New York City Subway Stations by Page Rank</h2>
          {ranks}
        </div>
      </div>
    );
  }
});

DOM.render(
  <PageRankDisplay />,
  document.getElementById('content')
);

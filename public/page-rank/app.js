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
      system: 'MTA',
      hoverStop: undefined
    };
  },
  componentDidMount: function() {
    this.socket = IO();
    
    let { socket } = this;
    
    socket.emit(socketMsg.requestSystem, this.state.system);
    socket.on(socketMsg.sendSystem, this._socketSendSystemHandler);
    
    socket.on(socketMsg.sendStops, this._socketSendStopsHandler);
    socket.on(socketMsg.sendMergedEdges, this._socketSendEdgesHandler);
    socket.on(socketMsg.sendMergedStops, this._socketSendMergedStopsHandler);
    socket.on(socketMsg.event, this._socketEventHandler);
  },
  _socketSendSystemHandler: function(system) {
    this.refs.map.setCenter(system.longitude, system.latitude, 13);
    this.setState({ 
      system: system.id
    });
  },
  _socketSendStopsHandler: function(stops) {
    console.log('stops', stops);
    this.setState({ stops: stops });
  },
  _socketSendMergedStopsHandler: function(mergedStops) {
    console.log('merged stops', mergedStops);
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
    });
  },
  handleMapLoad: function() {
    this.socket.emit(socketMsg.requestStops, this.state.system);
    this.socket.emit(socketMsg.requestMergedEdges, this.state.system);
    this.socket.emit(socketMsg.startPR, this.state.system);
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
  _handleSystemChange: function(system) {
    this.socket.emit(socketMsg.requestSystem, system);
    this.socket.emit(socketMsg.requestStops, system);
    this.socket.emit(socketMsg.requestMergedEdges, system);
    this.socket.emit(socketMsg.startPR, system);
  },
  render: function() {
    const { hoverStop } = this.state;
    var icons = this.state.system === 'MTA';
    var self = this;
    
    let ranks = this.state.infoBoxContents.map(function(stop) {
      return (
        <table key={stop.id} className='stop-table'>
        <tbody>
        <tr>
          <td className='cell-rank'>{self.state.infoBoxContents.indexOf(stop)+1}. <b>{stop.rank}</b></td>
          <td className='cell-name'>{stop.name}</td>
        </tr>
        <tr>
          <td className='cell-routes' colSpan='2'>
            { icons && <RouteList stop={stop} key={stop.id} /> }
          </td>
        </tr>
        </tbody>
        </table>
      );
    });
    
    let buttons = ['MTA','MBTA'].map(function(system) {
      return (<button className='btn btn-primary' onClick={self._handleSystemChange.bind(null, system)} key={system}>{system}</button>);
    });
    
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
              <div><em>{hoverStop.name}</em></div>
              <div><em>{hoverStop.id}</em></div>
              <div>Page Rank: {hoverStop.rank}</div>
              <div>Rank: {this.state.infoBoxContents.indexOf(hoverStop)+1} of {this.state.infoBoxContents.length}</div>
              { icons && <div><RouteList stop={hoverStop} /></div> }
            </div>
          </Popup>
        )}
        </Map>
        <div className='system-selector'>
          {buttons}
        </div>
        <div className='side-panel'>
          <h3>New York City Subway</h3>
          <h4>Stations by Page Rank</h4>
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

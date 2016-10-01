import React from 'react';
import DOM from 'react-dom';
import IO from 'socket.io-client';
import { Map, RouteList, Popup, GitHubRibbon, TweetButton } from '../../lib/dom/index';
import socketMsg from '../../lib/constants.js';

var PageRankDisplay = React.createClass({
  getInitialState: function() {
    return {
      infoBoxContents: [],
      stops: undefined,
      system: undefined,
      hoverStop: undefined
    };
  },
  componentDidMount: function() {
    let { system } = this.props;
    
    this.socket = IO();
    let { socket } = this;
    
    socket.emit(socketMsg.requestSystem, system);
    socket.on(socketMsg.sendSystem, this._socketSendSystemHandler);
    
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
  _socketSendMergedStopsHandler: function(stops) {
    this.setState({ stops });
    this.refs.map.addStops(stops);
  },
  _socketSendEdgesHandler: function(edges) {
    this.refs.map.addEdges(edges);
  },
  _socketEventHandler: function(event) {
    if (event.type === socketMsg.showRanks) {
      this.setState({ infoBoxContents: this._orderStopsByRank(event.data) });
      this.refs.map.showRanks(this.state.stops,event.data);
    }
  },
  _orderStopsByRank: function(ranks) {
    let stopsWithRanks = [];
    let { stops } = this.state;
    
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
    this.socket.emit(socketMsg.requestMergedStops, this.props.system);
    this.socket.emit(socketMsg.requestMergedEdges, this.props.system);
    this.socket.emit(socketMsg.startPR, this.props.system);
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
  _handleSystemChange: function(system) {
    this.socket.emit(socketMsg.requestSystem, system);
    this.socket.emit(socketMsg.requestMergedStops, system);
    this.socket.emit(socketMsg.requestMergedEdges, system);
    this.socket.emit(socketMsg.startPR, system);
  },
  render: function() {
    const { hoverStop, infoBoxContents } = this.state;
    const { system } = this.props;
    var showIcons = system === 'MTA';
    var self      = this;
    
    let ranks = infoBoxContents.map(function(stop) {
      return (
        <table key={stop.id} className='stop-table'>
        <tbody>
        <tr>
          <td className='cell-rank'>{infoBoxContents.indexOf(stop)+1}.</td>
          <td className='cell-rank'><b>{stop.rank}</b></td>
          <td className='cell-name'>{stop.name}</td>
        </tr>
        <tr>
          <td className='cell-routes' colSpan='3'>
            <RouteList showIcons={showIcons} stop={stop} key={stop.id} />
          </td>
        </tr>
        </tbody>
        </table>
      );
    });
    
    function navigateTo(system) {
      let url = '/page-rank/' + system.toLowerCase();
      window.location = url;
    }
    
    let buttons = ['NYC','Boston'].map(function(system) {
      return (<button className='btn btn-primary' onClick={navigateTo.bind(null, system)} key={system}>{system}</button>);
    });
    
    return (
      <div>
        <GitHubRibbon />
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
              <div>Page Rank: {hoverStop.rank}</div>
              <div>Rank: {infoBoxContents.indexOf(hoverStop)+1} of {infoBoxContents.length}</div>
              <div><RouteList showIcons={showIcons} stop={hoverStop} /></div>
            </div>
          </Popup>
        )}
        </Map>
        <div className='system-selector'>
          {buttons}
        </div>
        <div className='side-panel'>
          <div>
            <h1>{system}</h1>
            Stations by Page Rank
          </div>
          <div className='ranks'>
            {ranks}
          </div>
          <div>
            A <a href="http://www.tyleragreen.com/" target="_blank">Tyler A. Green</a> Project
          </div>
        </div>
      </div>
    );
  }
});

module.exports = PageRankDisplay;


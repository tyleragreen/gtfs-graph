import React from 'react';
import DOM from 'react-dom';
import IO from 'socket.io-client';
import classNames from 'classnames';
import { Map, RouteList, Popup, GitHubRibbon, Modal, ModalTrigger } from '../../lib/dom/index';
import socketMsg from '../../lib/constants.js';
var Mode = require('../../lib/enums').Mode;
var getStopList = require('../../lib/dom/unpack');

const CITIES = {
  nyc: 'NYC',
  boston: 'Boston',
  paris: 'Paris',
  dc: 'DC'
};
const API = `https://${window.location.hostname}/api/v0/`;
const MODAL_ID = 'infoModal';

const ZOOM = 13;

var GraphRankDisplay = React.createClass({
  getInitialState: function() {
    return {
      infoBoxContents: [],
      stops: undefined,
      system: undefined,
      hoverStop: undefined,
      mode: Mode.ACCESSIBILITY
    };
  },
  componentDidMount: function() {
    this.socket = IO();
    let { system } = this.props;
    let { socket } = this;
    let that = this;
    
    $.getJSON(API + 'system/'+system,function(json) {
      that._sendSystemHandler(json);
    });
    socket.on(socketMsg.event, this._eventHandler);
  },
  _sendSystemHandler: function(system) {
    this.refs.map.setCenter(system.longitude, system.latitude, ZOOM);
    this.setState({ 
      system: system.id
    });
  },
  _sendStopsHandler: function(stops) {
    this.setState({ stops });
    this.refs.map.addStops(stops);
  },
  _sendEdgesHandler: function(edges) {
    this.refs.map.addEdges(edges);
  },
  _eventHandler: function(event) {
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
      stop.rank = Math.round(rank * 100000) / 100000;
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
    const { system } = this.props;
    const { mode } = this.state;
    
    $.getJSON(`${API}graph/${system}?type=merged&filter=edges`, (json) => {
      this._sendEdgesHandler(json);
    });
    $.getJSON(`${API}graph/${system}?type=merged&filter=stops`, (json) => {
      let stops = getStopList(json);
      this._sendStopsHandler(stops);
      this.socket.emit(socketMsg.getMode, system, mode);
    });
  },
  handleStopHover: function(stopId) {
    if (typeof stopId === "undefined") {
      this.setState({ hoverStop: undefined });
    } else {
      this.setState({ hoverStop: this._lookupStop(stopId) });
    }
  },
  handleStopClick: function(stopId) {
    const stop = this._lookupStop(stopId);
    this.setState({ hoverStop: stop });
    this.refs.map.panTo(stop);
  },
  _lookupStop: function(stopId) {
    return this.state.stops[this.state.stops.map(stop => stop.id).indexOf(stopId)];
  },
  _handleModeChange: function(mode) {
    this.socket.emit(socketMsg.getMode, this.props.system, mode);
    this.setState({ mode });
  },
  render: function() {
    const { hoverStop, infoBoxContents } = this.state;
    const { system } = this.props;

    // We only have route icons for NYC (MTA) and Paris (RATP)
    var showIcons = system === 'MTA' || system === 'RATP';
    var self      = this;
    
    let ranks = infoBoxContents.map(function(stop) {
      return (
        <table
          key={stop.id}
          className='stop-table'
          onMouseOver={self.handleStopHover.bind(null, stop.id)}
          onClick={self.handleStopClick.bind(null, stop.id)}
        >
        <tbody>
        <tr>
          <td className='cell-rank'>{infoBoxContents.indexOf(stop)+1}.</td>
          <td className='cell-rank'><b>{stop.rank}</b></td>
          <td className='cell-name'>{stop.name}</td>
        </tr>
        <tr>
          <td className='cell-routes' colSpan='3'>
            <RouteList
              system={system}
              showIcons={showIcons}
              stop={stop}
              key={stop.id}
            />
          </td>
        </tr>
        </tbody>
        </table>
      );
    });
    
    function navigateTo(system) {
      let url = '/rank/' + system.toLowerCase();
      window.location = url;
    }
    let currentMode = this.state.mode;
    let currentCity = this.props.city;
    
    let buttons = Object.values(CITIES).map(function(system) {
      let btnClasses = classNames({
        btn: true,
        'btn-primary': system === currentCity
      });
      return (<button className={btnClasses} onClick={navigateTo.bind(null, system)} key={system}>{system}</button>);
    });
    let modes = Mode.ALL.map(function(mode) {
      let btnClasses = classNames({
        btn: true,
        'btn-primary': mode === currentMode
      });
      return (<button className={btnClasses} onClick={self._handleModeChange.bind(null, mode)} key={mode}>{mode}</button>);
    });
    
    return (
      <div>
        <Modal
          id={MODAL_ID}
          title='About'
        >
          <p>This project has two goals:</p>
          <ol>
            <li>Identify the most important stations in a transit network.</li>
            <li>Characterize the distribution of stations' importance across networks.</li>
          </ol>
          <p>Four "centrality" algorithms are employed. The first two, Page Rank and Katz, address the first question. The second two, Closeness and Outward Accessibility, address the second. None of these were invented with transit in mind, so all have advantages and drawbacks to this particular application. In the descriptions below, "nodes" can be thought of as "stations", and "edges" thought of as "routes".</p>
          <h4>Page Rank</h4>
          <p>Page Rank was invented by Google founder Larry Page and Sergey Brin to rank web pages for their search engine. In this algorithm, a node's importance is derived from the importance of all the nodes which link to it.</p>
          <h4>Katz Centrality</h4>
          <p>Katz Centrality is similar to Page Rank, but it considers the walk distance between nodes when evaluating their importance. A walk distance is the number of edges between any two nodes when performing a graph walk. A node will rank highly when it is connected via a small walk distance to many important nodes.</p>
          <h4>Closeness Centrality</h4>
          <p>Perhaps the most intuitive of the centrality algorithms, closeness centrality ranks a node by the sum of the shortest paths to all other nodes in the network. The closer a node is to all other nodes, the more it is considered to be "central".</p>
          <h4>Outward Accessibility</h4>
          <p>Outward accessibility is a normalized version of diversity entropy proposed in <a href="http://www.sciencedirect.com/science/article/pii/S0375960108015867" target="_blank">this paper</a> by Travençolo and Costa. A node ranks highly when many unique paths can be taken from it over a course of random walks of varying distances. Sections of a graph which rank high in this metric are found to have high network redundancy and high accessibility from the rest of the network.</p>
          <p style={{'borderTop': '1px solid #e5e5e5', 'paddingTop': '10px'}}>This project was built by <a href="http://www.tyleragreen.com" target="_blank">Tyler Green</a>. There is an additional <a href="/demo" target="_blank">landing page</a> to demonstrate basic graph algorithms applied to a transit graph.</p>
          <p>Feel free to contribute to the <a href="https://github.com/tyleragreen/gtfs-graph" target="_blank">code on GitHub</a>!</p>
        </Modal>
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
              <div>{currentMode}: {hoverStop.rank}</div>
              <div>Rank: {infoBoxContents.indexOf(hoverStop)+1} of {infoBoxContents.length}</div>
              <div><RouteList system={system} showIcons={showIcons} stop={hoverStop} /></div>
            </div>
          </Popup>
        )}
        </Map>
        <div className='system-selector'>
          {buttons}
        </div>
        <div className='mode-selector'>
          {modes}
        </div>
        <div className='side-panel'>
          <div>
            <h1>{currentCity}</h1>
            <ModalTrigger id={MODAL_ID} label='About' classes='modal-trigger' />
          </div>
          <div className='ranks'>
            {ranks}
          </div>
          <div id='legend'>
            <p><strong>Centrality Ranking</strong></p>
            <nav className='clearfix'>
              <span style={{background: '#00ff00'}}></span>
              <span style={{background: '#00ffff'}}></span>
              <span style={{background: '#0000ff'}}></span>
              <span style={{background: '#ff00ff'}}></span>
              <span style={{background: '#ff0000'}}></span>
              <label>Low</label>
              <label></label>
              <label>Medium</label>
              <label></label>
              <label>High</label>
            </nav>
          </div>
          <div>
            A <a href="http://www.tyleragreen.com/" target="_blank">Tyler A. Green</a> Project.
          </div>
        </div>
      </div>
    );
  }
});

module.exports = GraphRankDisplay;
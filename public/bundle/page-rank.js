require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({429:[function(require,module,exports){
'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

var _index = require('../../lib/dom/index');

var _constants = require('../../lib/constants.js');

var _constants2 = _interopRequireDefault(_constants);

var _systems = require('../../lib/systems.js');

var _systems2 = _interopRequireDefault(_systems);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PageRankDisplay = _react2.default.createClass({
  displayName: 'PageRankDisplay',

  getInitialState: function getInitialState() {
    return {
      infoBoxContents: [],
      stops: undefined,
      system: 'MBTA',
      hoverStop: undefined
    };
  },
  componentDidMount: function componentDidMount() {
    this.socket = (0, _socket2.default)();

    var socket = this.socket;


    socket.emit(_constants2.default.requestSystem, this.state.system);
    socket.on(_constants2.default.sendSystem, this._socketSendSystemHandler);

    socket.on(_constants2.default.sendMergedEdges, this._socketSendEdgesHandler);
    socket.on(_constants2.default.sendMergedStops, this._socketSendMergedStopsHandler);
    socket.on(_constants2.default.event, this._socketEventHandler);
  },
  _socketSendSystemHandler: function _socketSendSystemHandler(system) {
    this.refs.map.setCenter(system.longitude, system.latitude, 13);
    this.setState({
      system: system.id
    });
  },
  _socketSendMergedStopsHandler: function _socketSendMergedStopsHandler(stops) {
    this.setState({ stops: stops });
    this.refs.map.addStops(stops);
  },
  _socketSendEdgesHandler: function _socketSendEdgesHandler(edges) {
    this.refs.map.addEdges(edges);
  },
  _socketEventHandler: function _socketEventHandler(event) {
    if (event.type === _constants2.default.showRanks) {
      this.setState({ infoBoxContents: this._orderStopsByRank(event.data) });
      this.refs.map.showRanks(this.state.stops, event.data);
    }
  },
  _orderStopsByRank: function _orderStopsByRank(ranks) {
    var stopsWithRanks = [];
    var stops = this.state.stops;


    ranks.forEach(function (rank, node) {
      var stop = stops[node];
      stop.rank = Math.round(rank * 100) / 100;
      stopsWithRanks.push(stop);
    });
    return stopsWithRanks.sort(function (a, b) {
      if (a.rank < b.rank) return 1;
      if (a.rank > b.rank) return -1;
      return 0;
    });
  },
  handleMapLoad: function handleMapLoad() {
    this.socket.emit(_constants2.default.requestMergedStops, this.state.system);
    this.socket.emit(_constants2.default.requestMergedEdges, this.state.system);
    this.socket.emit(_constants2.default.startPR, this.state.system);
  },
  handleStopHover: function handleStopHover(stopId) {
    if (typeof stopId === "undefined") {
      this.setState({ hoverStop: undefined });
    } else {
      this.setState({ hoverStop: this._lookupStop(stopId) });
    }
  },
  _lookupStop: function _lookupStop(stopId) {
    return this.state.stops[this.state.stops.map(function (stop) {
      return stop.id;
    }).indexOf(stopId)];
  },
  _handleSystemChange: function _handleSystemChange(system) {
    this.socket.emit(_constants2.default.requestSystem, system);
    this.socket.emit(_constants2.default.requestMergedStops, system);
    this.socket.emit(_constants2.default.requestMergedEdges, system);
    this.socket.emit(_constants2.default.startPR, system);
  },
  render: function render() {
    var _state = this.state;
    var hoverStop = _state.hoverStop;
    var system = _state.system;
    var infoBoxContents = _state.infoBoxContents;

    var showIcons = system === 'MTA';
    var self = this;

    var ranks = infoBoxContents.map(function (stop) {
      return _react2.default.createElement(
        'table',
        { key: stop.id, className: 'stop-table' },
        _react2.default.createElement(
          'tbody',
          null,
          _react2.default.createElement(
            'tr',
            null,
            _react2.default.createElement(
              'td',
              { className: 'cell-rank' },
              infoBoxContents.indexOf(stop) + 1,
              '. ',
              _react2.default.createElement(
                'b',
                null,
                stop.rank
              )
            ),
            _react2.default.createElement(
              'td',
              { className: 'cell-name' },
              stop.name
            )
          ),
          _react2.default.createElement(
            'tr',
            null,
            _react2.default.createElement(
              'td',
              { className: 'cell-routes', colSpan: '2' },
              _react2.default.createElement(_index.RouteList, { showIcons: showIcons, stop: stop, key: stop.id })
            )
          )
        )
      );
    });

    var buttons = ['MTA', 'MBTA'].map(function (system) {
      return _react2.default.createElement(
        'button',
        { className: 'btn btn-primary', onClick: self._handleSystemChange.bind(null, system), key: system },
        system
      );
    });

    return _react2.default.createElement(
      'div',
      null,
      _react2.default.createElement(_index.GitHubRibbon, null),
      _react2.default.createElement(
        _index.Map,
        {
          onMapLoad: this.handleMapLoad,
          onStopHover: this.handleStopHover,
          ref: 'map'
        },
        hoverStop && _react2.default.createElement(
          _index.Popup,
          {
            longitude: hoverStop.longitude,
            latitude: hoverStop.latitude
          },
          _react2.default.createElement(
            'div',
            { className: 'popup' },
            _react2.default.createElement(
              'div',
              null,
              _react2.default.createElement(
                'em',
                null,
                hoverStop.name
              )
            ),
            _react2.default.createElement(
              'div',
              null,
              'Page Rank: ',
              hoverStop.rank
            ),
            _react2.default.createElement(
              'div',
              null,
              'Rank: ',
              infoBoxContents.indexOf(hoverStop) + 1,
              ' of ',
              infoBoxContents.length
            ),
            _react2.default.createElement(
              'div',
              null,
              _react2.default.createElement(_index.RouteList, { showIcons: showIcons, stop: hoverStop })
            )
          )
        )
      ),
      _react2.default.createElement(
        'div',
        { className: 'system-selector' },
        buttons
      ),
      _react2.default.createElement(
        'div',
        { className: 'side-panel' },
        _react2.default.createElement(
          'h3',
          null,
          system
        ),
        _react2.default.createElement(
          'h4',
          null,
          'Stations by Page Rank'
        ),
        ranks
      )
    );
  }
});

_reactDom2.default.render(_react2.default.createElement(PageRankDisplay, null), document.getElementById('content'));

},{"../../lib/constants.js":1,"../../lib/dom/index":2,"../../lib/systems.js":7,"react":380,"react-dom":206,"socket.io-client":381}]},{},[429]);

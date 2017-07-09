require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({667:[function(require,module,exports){
'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _reactAddonsUpdate = require('react-addons-update');

var _reactAddonsUpdate2 = _interopRequireDefault(_reactAddonsUpdate);

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _index = require('../../lib/dom/index');

var _constants = require('../../lib/constants.js');

var _constants2 = _interopRequireDefault(_constants);

var _systems = require('../../lib/systems.js');

var _systems2 = _interopRequireDefault(_systems);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var onClickOutside = require('react-onclickoutside');

var systemID = 'MTA';

var App = _react2.default.createClass({
  displayName: 'App',

  getInitialState: function getInitialState() {
    this.system = 'MTA';
    return {
      infoBoxContents: [],
      stops: undefined,
      mergedStops: undefined,
      mode: _constants2.default.dijkstra,
      origin: undefined,
      destination: undefined,
      hoverStop: undefined
    };
  },
  componentDidMount: function componentDidMount() {
    var socket = (0, _socket2.default)();

    socket.emit(_constants2.default.requestSystem, this.system);
    socket.on(_constants2.default.sendSystem, this._socketSendSystemHandler);

    socket.on(_constants2.default.sendStops, this._socketSendStopsHandler);
    socket.on(_constants2.default.sendEdges, this._socketSendEdgesHandler);
    socket.on(_constants2.default.event, this._socketEventHandler);

    this.setState({ socket: socket });
  },
  _socketSendSystemHandler: function _socketSendSystemHandler(system) {
    this.refs.map.setCenter(system.longitude, system.latitude, 13);
  },
  _socketSendStopsHandler: function _socketSendStopsHandler(stops) {
    this.setState({ stops: stops });
    this.refs.map.addStops(stops);
  },
  _socketSendEdgesHandler: function _socketSendEdgesHandler(edges) {
    this.refs.map.addEdges(edges);
  },
  _socketEventHandler: function _socketEventHandler(event) {
    if (event.type === _constants2.default.visitNode) {
      this.refs.map.visitEdge(event.data);
      var newLine = event.data.origin.name + ' to ' + event.data.destination.name;
      this.setState({ infoBoxContents: (0, _reactAddonsUpdate2.default)(this.state.infoBoxContents, { $push: [newLine] }) });
    } else if (event.type === _constants2.default.leaveNode) {
      this.refs.map.leaveEdge(event.data);
      var _newLine = 'Leave ' + event.data.origin.name + ' to ' + event.data.destination.name;
      this.setState({ infoBoxContents: (0, _reactAddonsUpdate2.default)(this.state.infoBoxContents, { $push: [_newLine] }) });
    } else if (event.type === _constants2.default.showRanks) {
      this.setState({ infoBoxContents: this._orderStopsByRank(event.data) });
      this.refs.map.showRanks(this.state.mergedStops, event.data);
    } else if (event.type === _constants2.default.summary) {
      var summaryMsg = this._parseSummaryMessage(event.data);
      var newContents = this.state.infoBoxContents.slice();
      newContents.unshift(summaryMsg);
      this.setState({ infoBoxContents: newContents });
      this.setState({ infoBoxSnapshot: newContents });
    } else {
      throw 'bad event type';
    }
  },
  _orderStopsByRank: function _orderStopsByRank(ranks) {
    var stopsWithRanks = [];
    var stops = this.state.mergedStops;
    ranks.forEach(function (rank, node) {
      var stop = stops[node];
      stop.rank = rank;
      stopsWithRanks.push(stop);
    });
    return stopsWithRanks.sort(function (a, b) {
      if (a.rank < b.rank) return 1;
      if (a.rank > b.rank) return -1;
      return 0;
    }).map(function (stop) {
      return stop.name + ': ' + stop.rank;
    });
  },
  _parseSummaryMessage: function _parseSummaryMessage(summary) {
    var summaryMsg;
    if (summary.hasOwnProperty('pathLength')) {
      var hours = Math.floor(summary.pathLength / 3600);
      var minutes = Math.floor(summary.pathLength % 3600 / 60);
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
  handleMapLoad: function handleMapLoad() {
    this.state.socket.emit(_constants2.default.requestStops, this.system);
    this.state.socket.emit(_constants2.default.requestEdges, this.system);
  },
  handleAutocomplete: function handleAutocomplete(query) {
    var numToReturn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;

    return this.state.stops.filter(function (stop) {
      return stop.name.toLowerCase().indexOf(query.toLowerCase()) !== -1;
    }).sort(function (a, b) {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    }).slice(0, numToReturn);
  },
  handleRun: function handleRun(mode, origin, destination) {
    var msg = 'start ' + mode;
    this.state.socket.emit(msg, this.system, origin, destination);
    this._clearTrace();
    this.setState({ infoBoxContents: [] });
  },
  _clearTrace: function _clearTrace() {
    var _this = this;

    setTimeout(function () {
      _this.refs.map.clearTrace();
    }, 80);
  },
  handleStop: function handleStop() {
    this.state.socket.emit(_constants2.default.clearQueue);
    this._clearTrace();
  },
  _handleStopHover: function _handleStopHover(stopId) {
    if (typeof stopId === "undefined") {
      this.setState({ hoverStop: undefined });
    } else {
      this.setState({ hoverStop: this._lookupStop(stopId) });
    }
  },
  _handleStopClick: function _handleStopClick(stopId) {
    if (this.state.mode !== _constants2.default.dijkstra && this.state.mode !== _constants2.default.pageRank) {
      this.handleEndpointSetById('origin', stopId);
    }
  },
  handleEndpointSetById: function handleEndpointSetById(inputField, stopId) {
    this.handleEndpointSet(inputField, this._lookupStop(stopId));
  },
  handleEndpointSet: function handleEndpointSet(inputField, stop) {
    this.setState({ infoBoxSnapshot: undefined });
    this.setState(_defineProperty({}, inputField, stop));
  },
  _lookupStop: function _lookupStop(stopId) {
    return this.state.stops[this.state.stops.map(function (stop) {
      return stop.id;
    }).indexOf(stopId)];
  },
  _handleModeChange: function _handleModeChange(mode) {
    this.setState({ infoBoxSnapshot: undefined });
    this.setState({ mode: mode });
  },
  render: function render() {
    var _state = this.state,
        hoverStop = _state.hoverStop,
        mode = _state.mode,
        origin = _state.origin,
        destination = _state.destination;


    return _react2.default.createElement(
      'div',
      null,
      _react2.default.createElement(_index.GitHubRibbon, null),
      _react2.default.createElement(
        _index.Map,
        {
          latitude: _systems2.default.MTA.latitude,
          longitude: _systems2.default.MTA.longitude,
          zoomLevel: 11,
          onMapLoad: this.handleMapLoad,
          onStopHover: this._handleStopHover,
          onStopClick: this._handleStopClick,
          ref: 'map'
        },
        origin && _react2.default.createElement(
          _index.Popup,
          {
            longitude: origin.longitude,
            latitude: origin.latitude,
            ref: 'origin',
            key: 'origin'
          },
          _react2.default.createElement(
            'div',
            { className: 'popup' },
            _react2.default.createElement(
              'div',
              null,
              _react2.default.createElement(
                'b',
                null,
                'Origin'
              )
            ),
            _react2.default.createElement(
              'div',
              null,
              origin.name
            ),
            _react2.default.createElement(
              'div',
              null,
              _react2.default.createElement(_index.RouteList, { system: systemID, showIcons: true, stop: origin })
            )
          )
        ),
        destination && _react2.default.createElement(
          _index.Popup,
          {
            longitude: destination.longitude,
            latitude: destination.latitude,
            ref: 'destination',
            key: 'destination'
          },
          _react2.default.createElement(
            'div',
            { className: 'popup' },
            _react2.default.createElement(
              'div',
              null,
              _react2.default.createElement(
                'b',
                null,
                'Destination'
              )
            ),
            _react2.default.createElement(
              'div',
              null,
              destination.name
            ),
            _react2.default.createElement(
              'div',
              null,
              _react2.default.createElement(_index.RouteList, { system: systemID, showIcons: true, stop: destination })
            )
          )
        ),
        hoverStop && mode !== _constants2.default.dijkstra && hoverStop != origin && hoverStop != destination && _react2.default.createElement(
          _index.Popup,
          {
            longitude: hoverStop.longitude,
            latitude: hoverStop.latitude,
            ref: 'popup',
            key: 'popup'
          },
          _react2.default.createElement(
            'div',
            { className: 'popup' },
            _react2.default.createElement(
              'div',
              null,
              hoverStop.name
            ),
            _react2.default.createElement(
              'div',
              null,
              _react2.default.createElement(_index.RouteList, { system: systemID, showIcons: true, stop: hoverStop })
            )
          )
        ),
        hoverStop && mode === _constants2.default.dijkstra && hoverStop != origin && hoverStop != destination && _react2.default.createElement(
          _index.Popup,
          {
            longitude: hoverStop.longitude,
            latitude: hoverStop.latitude,
            ref: 'popup',
            key: 'popup'
          },
          _react2.default.createElement(
            'div',
            { className: 'popup' },
            _react2.default.createElement(
              'div',
              null,
              hoverStop.name
            ),
            _react2.default.createElement(
              'div',
              null,
              _react2.default.createElement(_index.RouteList, { system: systemID, showIcons: true, stop: hoverStop })
            ),
            _react2.default.createElement(
              'div',
              null,
              _react2.default.createElement(
                'button',
                { className: 'btn btn-primary', onClick: this.handleEndpointSet.bind(null, 'origin', hoverStop) },
                'Origin'
              ),
              _react2.default.createElement(
                'button',
                { className: 'btn btn-primary', onClick: this.handleEndpointSet.bind(null, 'destination', hoverStop) },
                'Destination'
              )
            )
          )
        )
      ),
      _react2.default.createElement(Menu, {
        onAutocomplete: this.handleAutocomplete,
        onEndpointSet: this.handleEndpointSet,
        onModeChange: this._handleModeChange,
        onRun: this.handleRun,
        onStop: this.handleStop,
        zoomIn: this._handleZoomIn,
        zoomOut: this._handleZoomOut,
        mode: this.state.mode,
        origin: this.state.origin,
        destination: this.state.destination,
        infoBoxContents: this.state.infoBoxSnapshot,
        ref: 'menu'
      })
    );
  }
});

var Menu = _react2.default.createClass({
  displayName: 'Menu',

  _handleRun: function _handleRun() {
    if (this.props.mode === _constants2.default.dijkstra) {
      var originInvalid = typeof this.props.origin === "undefined";
      var destinationInvalid = typeof this.props.destination === "undefined";

      if (originInvalid) {
        this.refs.origin.getInstance().markInvalid();
      }
      if (destinationInvalid) {
        this.refs.destination.getInstance().markInvalid();
      }
      if (!originInvalid && !destinationInvalid) {
        this.props.onRun(this.props.mode, this.props.origin.id, this.props.destination.id);
      }
    } else if (this.props.mode === _constants2.default.dfs || this.props.mode === _constants2.default.bfs) {
      if (typeof this.props.origin === "undefined") {
        this.refs.origin.getInstance().markInvalid();
      } else {
        this.props.onRun(this.props.mode, this.props.origin.id);
      }
    } else {
      this.props.onRun(this.props.mode);
    }
  },
  _handleStop: function _handleStop() {
    this.props.onStop();
  },
  _handleModeChange: function _handleModeChange(mode) {
    //if (mode === socketMsg.dfs || mode === socketMsg.bfs) {
    //  this.props.zoomOut();
    //} else {
    //  this.props.zoomIn();
    //}
    this.props.onModeChange(mode);
  },
  handleAutocomplete: function handleAutocomplete(query) {
    return this.props.onAutocomplete(query);
  },
  handleEndpointSet: function handleEndpointSet(inputField, stop) {
    this.props.onEndpointSet(inputField, stop);
  },
  handleEndpointClear: function handleEndpointClear(inputField) {
    this.props.onEndpointSet(inputField, undefined);
  },
  render: function render() {
    var selectors;
    if (this.props.mode === _constants2.default.dijkstra) {
      selectors = _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(StopSelector, {
          onAutocomplete: this.handleAutocomplete,
          onEndpointSet: this.handleEndpointSet,
          onEndpointClear: this.handleEndpointClear,
          selectedStop: this.props.origin,
          label: 'Origin',
          ref: 'origin'
        }),
        _react2.default.createElement(StopSelector, {
          onAutocomplete: this.handleAutocomplete,
          onEndpointSet: this.handleEndpointSet,
          onEndpointClear: this.handleEndpointClear,
          selectedStop: this.props.destination,
          label: 'Destination',
          ref: 'destination'
        })
      );
    } else if (this.props.mode === _constants2.default.dfs || this.props.mode === _constants2.default.bfs) {
      selectors = _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(StopSelector, {
          onAutocomplete: this.handleAutocomplete,
          onEndpointSet: this.handleEndpointSet,
          onEndpointClear: this.handleEndpointClear,
          selectedStop: this.props.origin,
          label: 'Origin',
          ref: 'origin'
        })
      );
    }
    var _props = this.props,
        infoBoxContents = _props.infoBoxContents,
        mode = _props.mode;

    var showInfoBox = infoBoxContents; //.length > 0;
    var menuClasses = (0, _classnames2.default)({
      'box': true,
      'with-info': showInfoBox
    });
    var wrapperClass = (0, _classnames2.default)({
      'top-menu-wrapper': true,
      'hidden': showInfoBox
    });

    return _react2.default.createElement(
      'div',
      { id: 'controlMenu', className: menuClasses },
      _react2.default.createElement(
        'div',
        { className: wrapperClass },
        _react2.default.createElement(ModeSelector, {
          mode: mode,
          onModeChange: this._handleModeChange
        }),
        selectors,
        _react2.default.createElement(Button, { label: 'Run!', onClick: this._handleRun, key: 'run' }),
        _react2.default.createElement(Button, { label: 'Stop', onClick: this._handleStop, key: 'stop' }),
        showInfoBox && _react2.default.createElement(
          'div',
          { className: 'info-wrapper' },
          _react2.default.createElement(InfoBox, { ref: 'infoBox', contents: infoBoxContents })
        )
      )
    );
  }
});

var InfoBox = _react2.default.createClass({
  displayName: 'InfoBox',

  render: function render() {
    var contents = this.props.contents.map(function (item, index) {
      return _react2.default.createElement(
        'div',
        { className: 'info-row', key: index },
        item
      );
    });
    return _react2.default.createElement(
      'div',
      { id: 'info-box', className: 'box', key: 'box' },
      contents
    );
  }
});

var StopSelector = onClickOutside(_react2.default.createClass({
  displayName: 'StopSelector',

  handleClickOutside: function handleClickOutside() {
    this.setState({
      stops: []
    });
  },
  getInitialState: function getInitialState() {
    return {
      searchValue: '',
      stops: [],
      valid: true
    };
  },
  markInvalid: function markInvalid() {
    this.setState({ valid: false });
  },
  markValid: function markValid() {
    this.setState({ valid: true });
  },
  setSelectedStop: function setSelectedStop(selectedStop) {
    this.setState({ valid: true });
  },
  handleSuggestionClick: function handleSuggestionClick(itemId) {
    var stopFilter = this.state.stops.filter(function (stop) {
      return stop.id === itemId;
    });
    if (stopFilter.length !== 1) {
      throw 'bad stop selected';
    }

    var stop = stopFilter[0];

    this.setState({
      searchValue: stop.name,
      stops: []
    });

    // Let the Menu know what stop was selected
    this.props.onEndpointSet(this.props.label.toLowerCase(), stop);
  },
  handleChange: function handleChange(e) {
    this.setState({
      searchValue: e.target.value,
      valid: true,
      stops: this.props.onAutocomplete(e.target.value)
    });
  },
  handleTokenClose: function handleTokenClose(e) {
    // Prevent the token click event from firing
    e.stopPropagation();

    this.setState({
      searchValue: "",
      stops: []
    });
    this.props.onEndpointClear(this.props.label.toLowerCase());
  },
  handleTokenClick: function handleTokenClick(e) {
    var prevStopName = this.props.selectedStop.name;
    this.setState({
      searchValue: prevStopName
    });
    this.props.onEndpointClear(this.props.label.toLowerCase());
  },
  componentWillUnmount: function componentWillUnmount() {
    this.props.onEndpointClear(this.props.label.toLowerCase());
  },
  render: function render() {
    var inputFieldClasses = (0, _classnames2.default)({
      'input-field': true,
      'form-control': true,
      'form-control-danger': !this.state.valid
    });
    var inputWrapperClasses = (0, _classnames2.default)({
      'input-wrapper': true,
      'form-group': true,
      'has-danger': !this.state.valid
    });
    if (typeof this.props.selectedStop !== "undefined") {
      var token = _react2.default.createElement(SearchToken, {
        stop: this.props.selectedStop,
        onTokenClose: this.handleTokenClose,
        onTokenClick: this.handleTokenClick
      });
    }
    return _react2.default.createElement(
      'div',
      null,
      _react2.default.createElement(
        'div',
        { className: 'input-label' },
        this.props.label,
        ':\xA0'
      ),
      _react2.default.createElement(
        'div',
        { className: inputWrapperClasses },
        _react2.default.createElement('input', {
          type: 'search',
          id: 'origin',
          className: inputFieldClasses,
          value: this.state.searchValue,
          onChange: this.handleChange,
          onClick: this.handleChange,
          disabled: typeof this.state.selectedStop !== "undefined"
        }),
        token
      ),
      _react2.default.createElement(SearchSuggestionList, {
        data: this.state.stops,
        onItemClick: this.handleSuggestionClick
      })
    );
  }
}));

var SearchToken = _react2.default.createClass({
  displayName: 'SearchToken',

  render: function render() {
    return _react2.default.createElement(
      'div',
      { className: 'input-token', onClick: this.props.onTokenClick },
      _react2.default.createElement(_index.RouteList, { system: systemID, showIcons: true, stop: this.props.stop }),
      '\xA0\xA0',
      this.props.stop.name,
      _react2.default.createElement(
        'div',
        { className: 'input-token-close', onClick: this.props.onTokenClose },
        '\xD7'
      )
    );
  }
});

var SearchSuggestionList = _react2.default.createClass({
  displayName: 'SearchSuggestionList',

  handleItemClick: function handleItemClick(itemId) {
    this.props.onItemClick(itemId);
  },
  render: function render() {
    var list;

    if (this.props.data.length > 0) {
      var self = this;
      var suggestions = this.props.data.map(function (stop) {
        return _react2.default.createElement(SearchSuggestion, {
          key: stop.id,
          id: stop.id,
          stop: stop,
          onItemClick: self.handleItemClick
        });
      });
      list = _react2.default.createElement(
        'ul',
        { id: 'suggestions' },
        suggestions
      );
    }

    return _react2.default.createElement(
      'div',
      null,
      list
    );
  }
});

var SearchSuggestion = _react2.default.createClass({
  displayName: 'SearchSuggestion',

  handleClick: function handleClick() {
    this.props.onItemClick(this.props.id);
  },
  render: function render() {
    return _react2.default.createElement(
      'li',
      {
        onClick: this.handleClick
      },
      _react2.default.createElement(_index.RouteList, { system: systemID, showIcons: true, stop: this.props.stop }),
      '\xA0\xA0',
      this.props.stop.name
    );
  }
});

var Button = _react2.default.createClass({
  displayName: 'Button',

  render: function render() {
    return _react2.default.createElement(
      'div',
      { className: 'btn-container' },
      _react2.default.createElement(
        'button',
        { className: 'btn btn-primary btn-block', onClick: this.props.onClick },
        this.props.label
      )
    );
  }
});

var ModeSelector = _react2.default.createClass({
  displayName: 'ModeSelector',

  _handleChange: function _handleChange(e) {
    this.props.onModeChange(e.target.value);
  },
  render: function render() {
    return _react2.default.createElement(
      'div',
      null,
      'Traversal Type:\xA0',
      _react2.default.createElement(
        'select',
        {
          id: 'type',
          className: 'form-control',
          value: this.props.mode,
          onChange: this._handleChange
        },
        _react2.default.createElement(
          'option',
          { value: _constants2.default.dijkstra },
          'Shortest Path Search'
        ),
        _react2.default.createElement(
          'option',
          { value: _constants2.default.dfs },
          'Depth-First Search'
        ),
        _react2.default.createElement(
          'option',
          { value: _constants2.default.bfs },
          'Breadth-First Search'
        )
      )
    );
  }
});

_reactDom2.default.render(_react2.default.createElement(App, null), document.getElementById('content'));

},{"../../lib/constants.js":1,"../../lib/dom/index":2,"../../lib/systems.js":12,"classnames":69,"react":547,"react-addons-update":393,"react-dom":394,"react-onclickoutside":521,"socket.io-client":574}],521:[function(require,module,exports){
/**
 * A higher-order-component for handling onClickOutside for React components.
 */
(function(root) {

  // administrative
  var registeredComponents = [];
  var handlers = [];
  var IGNORE_CLASS = 'ignore-react-onclickoutside';
  var DEFAULT_EVENTS = ['mousedown', 'touchstart'];

  /**
   * Check whether some DOM node is our Component's node.
   */
  var isNodeFound = function(current, componentNode, ignoreClass) {
    if (current === componentNode) {
      return true;
    }
    // SVG <use/> elements do not technically reside in the rendered DOM, so
    // they do not have classList directly, but they offer a link to their
    // corresponding element, which can have classList. This extra check is for
    // that case.
    // See: http://www.w3.org/TR/SVG11/struct.html#InterfaceSVGUseElement
    // Discussion: https://github.com/Pomax/react-onclickoutside/pull/17
    if (current.correspondingElement) {
      return current.correspondingElement.classList.contains(ignoreClass);
    }
    return current.classList.contains(ignoreClass);
  };

  /**
   * Try to find our node in a hierarchy of nodes, returning the document
   * node as highest noode if our node is not found in the path up.
   */
  var findHighest = function(current, componentNode, ignoreClass) {
    if (current === componentNode) {
      return true;
    }

    // If source=local then this event came from 'somewhere'
    // inside and should be ignored. We could handle this with
    // a layered approach, too, but that requires going back to
    // thinking in terms of Dom node nesting, running counter
    // to React's 'you shouldn't care about the DOM' philosophy.
    while(current.parentNode) {
      if (isNodeFound(current, componentNode, ignoreClass)) {
        return true;
      }
      current = current.parentNode;
    }
    return current;
  };

  /**
   * Check if the browser scrollbar was clicked
   */
  var clickedScrollbar = function(evt) {
    return document.documentElement.clientWidth <= evt.clientX || document.documentElement.clientHeight <= evt.clientY;
  };

  /**
   * Generate the event handler that checks whether a clicked DOM node
   * is inside of, or lives outside of, our Component's node tree.
   */
  var generateOutsideCheck = function(componentNode, componentInstance, eventHandler, ignoreClass, excludeScrollbar, preventDefault, stopPropagation) {
    return function(evt) {
      if (preventDefault) {
        evt.preventDefault();
      }
      if (stopPropagation) {
        evt.stopPropagation();
      }
      var current = evt.target;
      if((excludeScrollbar && clickedScrollbar(evt)) || (findHighest(current, componentNode, ignoreClass) !== document)) {
        return;
      }
      eventHandler(evt);
    };
  };

  /**
   * This function generates the HOC function that you'll use
   * in order to impart onOutsideClick listening to an
   * arbitrary component. It gets called at the end of the
   * bootstrapping code to yield an instance of the
   * onClickOutsideHOC function defined inside setupHOC().
   */
  function setupHOC(root, React, ReactDOM, createReactClass) {

    // The actual Component-wrapping HOC:
    return function onClickOutsideHOC(Component, config) {
      var wrapComponentWithOnClickOutsideHandling = createReactClass({
        statics: {
          /**
           * Access the wrapped Component's class.
           */
          getClass: function() {
            if (Component.getClass) {
              return Component.getClass();
            }
            return Component;
          }
        },

        /**
         * Access the wrapped Component's instance.
         */
        getInstance: function() {
          return Component.prototype.isReactComponent ? this.refs.instance : this;
        },

        // this is given meaning in componentDidMount
        __outsideClickHandler: function() {},

        getDefaultProps: function() {
          return {
            excludeScrollbar: config && config.excludeScrollbar
          };
        },

        /**
         * Add click listeners to the current document,
         * linked to this component's state.
         */
        componentDidMount: function() {
          // If we are in an environment without a DOM such
          // as shallow rendering or snapshots then we exit
          // early to prevent any unhandled errors being thrown.
          if (typeof document === 'undefined' || !document.createElement){
            return;
          }

          var instance = this.getInstance();
          var clickOutsideHandler;

          if(config && typeof config.handleClickOutside === 'function') {
            clickOutsideHandler = config.handleClickOutside(instance);
            if(typeof clickOutsideHandler !== 'function') {
              throw new Error('Component lacks a function for processing outside click events specified by the handleClickOutside config option.');
            }
          } else if(typeof instance.handleClickOutside === 'function') {
            if (React.Component.prototype.isPrototypeOf(instance)) {
              clickOutsideHandler = instance.handleClickOutside.bind(instance);
            } else {
              clickOutsideHandler = instance.handleClickOutside;
            }
          } else if(typeof instance.props.handleClickOutside === 'function') {
            clickOutsideHandler = instance.props.handleClickOutside;
          } else {
            throw new Error('Component lacks a handleClickOutside(event) function for processing outside click events.');
          }

          var componentNode = ReactDOM.findDOMNode(instance);
          if (componentNode === null) {
            console.warn('Antipattern warning: there was no DOM node associated with the component that is being wrapped by outsideClick.');
            console.warn([
              'This is typically caused by having a component that starts life with a render function that',
              'returns `null` (due to a state or props value), so that the component \'exist\' in the React',
              'chain of components, but not in the DOM.\n\nInstead, you need to refactor your code so that the',
              'decision of whether or not to show your component is handled by the parent, in their render()',
              'function.\n\nIn code, rather than:\n\n  A{render(){return check? <.../> : null;}\n  B{render(){<A check=... />}\n\nmake sure that you',
              'use:\n\n  A{render(){return <.../>}\n  B{render(){return <...>{ check ? <A/> : null }<...>}}\n\nThat is:',
              'the parent is always responsible for deciding whether or not to render any of its children.',
              'It is not the child\'s responsibility to decide whether a render instruction from above should',
              'get ignored or not by returning `null`.\n\nWhen any component gets its render() function called,',
              'that is the signal that it should be rendering its part of the UI. It may in turn decide not to',
              'render all of *its* children, but it should never return `null` for itself. It is not responsible',
              'for that decision.'
            ].join(' '));
          }

          var fn = this.__outsideClickHandler = generateOutsideCheck(
            componentNode,
            instance,
            clickOutsideHandler,
            this.props.outsideClickIgnoreClass || IGNORE_CLASS,
            this.props.excludeScrollbar, // fallback not needed, prop always exists because of getDefaultProps
            this.props.preventDefault || false,
            this.props.stopPropagation || false
          );

          var pos = registeredComponents.length;
          registeredComponents.push(this);
          handlers[pos] = fn;

          // If there is a truthy disableOnClickOutside property for this
          // component, don't immediately start listening for outside events.
          if (!this.props.disableOnClickOutside) {
            this.enableOnClickOutside();
          }
        },

        /**
        * Track for disableOnClickOutside props changes and enable/disable click outside
        */
        componentWillReceiveProps: function(nextProps) {
          if (this.props.disableOnClickOutside && !nextProps.disableOnClickOutside) {
            this.enableOnClickOutside();
          } else if (!this.props.disableOnClickOutside && nextProps.disableOnClickOutside) {
            this.disableOnClickOutside();
          }
        },

        /**
         * Remove the document's event listeners
         */
        componentWillUnmount: function() {
          this.disableOnClickOutside();
          this.__outsideClickHandler = false;
          var pos = registeredComponents.indexOf(this);
          if( pos>-1) {
            // clean up so we don't leak memory
            if (handlers[pos]) { handlers.splice(pos, 1); }
            registeredComponents.splice(pos, 1);
          }
        },

        /**
         * Can be called to explicitly enable event listening
         * for clicks and touches outside of this element.
         */
        enableOnClickOutside: function() {
          var fn = this.__outsideClickHandler;
          if (typeof document !== 'undefined') {
            var events = this.props.eventTypes || DEFAULT_EVENTS;
            if (!events.forEach) {
              events = [events];
            }
            events.forEach(function (eventName) {
              document.addEventListener(eventName, fn);
            });
          }
        },

        /**
         * Can be called to explicitly disable event listening
         * for clicks and touches outside of this element.
         */
        disableOnClickOutside: function() {
          var fn = this.__outsideClickHandler;
          if (typeof document !== 'undefined') {
            var events = this.props.eventTypes || DEFAULT_EVENTS;
            if (!events.forEach) {
              events = [events];
            }
            events.forEach(function (eventName) {
              document.removeEventListener(eventName, fn);
            });
          }
        },

        /**
         * Pass-through render
         */
        render: function() {
          var passedProps = this.props;
          var props = {};
          Object.keys(this.props).forEach(function(key) {
            if (key !== 'excludeScrollbar') {
              props[key] = passedProps[key];
            }
          });
          if (Component.prototype.isReactComponent) {
            props.ref = 'instance';
          }
          props.disableOnClickOutside = this.disableOnClickOutside;
          props.enableOnClickOutside = this.enableOnClickOutside;
          return React.createElement(Component, props);
        }
      });

      // Add display name for React devtools
      (function bindWrappedComponentName(c, wrapper) {
        var componentName = c.displayName || c.name || 'Component';
        wrapper.displayName = 'OnClickOutside(' + componentName + ')';
      }(Component, wrapComponentWithOnClickOutsideHandling));

      return wrapComponentWithOnClickOutsideHandling;
    };
  }

  /**
   * This function sets up the library in ways that
   * work with the various modulde loading solutions
   * used in JavaScript land today.
   */
  function setupBinding(root, factory) {
    if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module.
      define(['react','react-dom','create-react-class'], function(React, ReactDom, createReactClass) {
        if (!createReactClass) createReactClass = React.createClass;
        return factory(root, React, ReactDom, createReactClass);
      });
    } else if (typeof exports === 'object') {
      // Node. Note that this does not work with strict
      // CommonJS, but only CommonJS-like environments
      // that support module.exports
      module.exports = factory(root, require('react'), require('react-dom'), require('create-react-class'));
    } else {
      // Browser globals (root is window)
      var createReactClass = React.createClass ? React.createClass : window.createReactClass;
      root.onClickOutside = factory(root, React, ReactDOM, createReactClass);
    }
  }

  // Make it all happen
  setupBinding(root, setupHOC);

}(this));

},{"create-react-class":81,"react":547,"react-dom":394}],393:[function(require,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _assign = require('object-assign');
var invariant = require('fbjs/lib/invariant');
var hasOwnProperty = {}.hasOwnProperty;

function shallowCopy(x) {
  if (Array.isArray(x)) {
    return x.concat();
  } else if (x && typeof x === 'object') {
    return _assign(new x.constructor(), x);
  } else {
    return x;
  }
}

var COMMAND_PUSH = '$push';
var COMMAND_UNSHIFT = '$unshift';
var COMMAND_SPLICE = '$splice';
var COMMAND_SET = '$set';
var COMMAND_MERGE = '$merge';
var COMMAND_APPLY = '$apply';

var ALL_COMMANDS_LIST = [
  COMMAND_PUSH,
  COMMAND_UNSHIFT,
  COMMAND_SPLICE,
  COMMAND_SET,
  COMMAND_MERGE,
  COMMAND_APPLY
];

var ALL_COMMANDS_SET = {};

ALL_COMMANDS_LIST.forEach(function(command) {
  ALL_COMMANDS_SET[command] = true;
});

function invariantArrayCase(value, spec, command) {
  invariant(
    Array.isArray(value),
    'update(): expected target of %s to be an array; got %s.',
    command,
    value
  );
  var specValue = spec[command];
  invariant(
    Array.isArray(specValue),
    'update(): expected spec of %s to be an array; got %s. ' +
      'Did you forget to wrap your parameter in an array?',
    command,
    specValue
  );
}

/**
 * Returns a updated shallow copy of an object without mutating the original.
 * See https://facebook.github.io/react/docs/update.html for details.
 */
function update(value, spec) {
  invariant(
    typeof spec === 'object',
    'update(): You provided a key path to update() that did not contain one ' +
      'of %s. Did you forget to include {%s: ...}?',
    ALL_COMMANDS_LIST.join(', '),
    COMMAND_SET
  );

  if (hasOwnProperty.call(spec, COMMAND_SET)) {
    invariant(
      Object.keys(spec).length === 1,
      'Cannot have more than one key in an object with %s',
      COMMAND_SET
    );

    return spec[COMMAND_SET];
  }

  var nextValue = shallowCopy(value);

  if (hasOwnProperty.call(spec, COMMAND_MERGE)) {
    var mergeObj = spec[COMMAND_MERGE];
    invariant(
      mergeObj && typeof mergeObj === 'object',
      "update(): %s expects a spec of type 'object'; got %s",
      COMMAND_MERGE,
      mergeObj
    );
    invariant(
      nextValue && typeof nextValue === 'object',
      "update(): %s expects a target of type 'object'; got %s",
      COMMAND_MERGE,
      nextValue
    );
    _assign(nextValue, spec[COMMAND_MERGE]);
  }

  if (hasOwnProperty.call(spec, COMMAND_PUSH)) {
    invariantArrayCase(value, spec, COMMAND_PUSH);
    spec[COMMAND_PUSH].forEach(function(item) {
      nextValue.push(item);
    });
  }

  if (hasOwnProperty.call(spec, COMMAND_UNSHIFT)) {
    invariantArrayCase(value, spec, COMMAND_UNSHIFT);
    spec[COMMAND_UNSHIFT].forEach(function(item) {
      nextValue.unshift(item);
    });
  }

  if (hasOwnProperty.call(spec, COMMAND_SPLICE)) {
    invariant(
      Array.isArray(value),
      'Expected %s target to be an array; got %s',
      COMMAND_SPLICE,
      value
    );
    invariant(
      Array.isArray(spec[COMMAND_SPLICE]),
      'update(): expected spec of %s to be an array of arrays; got %s. ' +
        'Did you forget to wrap your parameters in an array?',
      COMMAND_SPLICE,
      spec[COMMAND_SPLICE]
    );
    spec[COMMAND_SPLICE].forEach(function(args) {
      invariant(
        Array.isArray(args),
        'update(): expected spec of %s to be an array of arrays; got %s. ' +
          'Did you forget to wrap your parameters in an array?',
        COMMAND_SPLICE,
        spec[COMMAND_SPLICE]
      );
      nextValue.splice.apply(nextValue, args);
    });
  }

  if (hasOwnProperty.call(spec, COMMAND_APPLY)) {
    invariant(
      typeof spec[COMMAND_APPLY] === 'function',
      'update(): expected spec of %s to be a function; got %s.',
      COMMAND_APPLY,
      spec[COMMAND_APPLY]
    );
    nextValue = spec[COMMAND_APPLY](nextValue);
  }

  for (var k in spec) {
    if (!(ALL_COMMANDS_SET.hasOwnProperty(k) && ALL_COMMANDS_SET[k])) {
      nextValue[k] = update(value[k], spec[k]);
    }
  }

  return nextValue;
}

module.exports = update;

},{"fbjs/lib/invariant":144,"object-assign":345}],81:[function(require,module,exports){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

var React = require('react');
var factory = require('./factory');

if (typeof React === 'undefined') {
  throw Error(
    'create-react-class could not find the React object. If you are using script tags, ' +
      'make sure that React is being loaded before create-react-class.'
  );
}

// Hack to grab NoopUpdateQueue from isomorphic React
var ReactNoopUpdateQueue = new React.Component().updater;

module.exports = factory(
  React.Component,
  React.isValidElement,
  ReactNoopUpdateQueue
);

},{"./factory":80,"react":547}],12:[function(require,module,exports){
'use strict';

var Systems = {
  MTA: {
    location: 'New York City',
    latitude: 40.75,
    longitude: -73.96,
    connectionString: 'postgres://thebusrider:3ll3board!@mta-gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/mta_gtfs',
    stops_view: "SELECT stop_id AS id, stop_name AS name, stop_lat AS latitude, stop_lon AS longitude FROM stops WHERE stop_id NOT LIKE '%N' AND stop_id NOT LIKE '%S'",
    routes_view: "SELECT DISTINCT substring(st.stop_id from 0 for char_length(st.stop_id)) AS stop_id, r.route_id AS route_id, r.route_color AS route_color FROM stop_times st JOIN trips t ON st.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id",
    edges_view: "SELECT DISTINCT substring(st1.stop_id from 0 for char_length(st1.stop_id)) AS origin, substring(st2.stop_id from 0 for char_length(st2.stop_id)) AS destination, 'route' AS type, EXTRACT(EPOCH FROM st2.departure_time-st1.departure_time) AS duration FROM stop_times st1 JOIN stop_times st2 ON st1.trip_id = st2.trip_id WHERE st2.stop_sequence = (st1.stop_sequence+1) UNION SELECT from_stop_id AS origin, to_stop_id AS destination, 'transfer' AS type, min_transfer_time AS duration FROM transfers WHERE from_stop_id != to_stop_id"
  },
  MBTA: {
    location: 'Boston',
    latitude: 42.358056,
    longitude: -71.063611,
    connectionString: 'postgres://thebusrider:3ll3board!@gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/gtfs',
    stop_times_view: "SELECT row_number() OVER (), * FROM stop_times ORDER BY trip_id, stop_sequence",
    stops_view: "SELECT stop_id AS id, stop_name AS name, stop_lat AS latitude, stop_lon AS longitude FROM stops WHERE location_type='t'",
    routes_view: "SELECT DISTINCT s.parent_station AS stop_id, r.route_id AS route_id, r.route_color AS route_color FROM stop_times st JOIN trips t ON st.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id JOIN stops s ON st.stop_id=s.stop_id WHERE s.parent_station != '' AND r.route_desc LIKE 'Rapid Transit'",
    edges_view: "SELECT DISTINCT s1.parent_station AS origin, s2.parent_station AS destination, 'route' AS type, EXTRACT(EPOCH FROM st2.departure_time-st1.departure_time) AS duration FROM stop_times_view st1 JOIN stop_times_view st2 ON st1.trip_id = st2.trip_id JOIN stops s1 ON st1.stop_id=s1.stop_id JOIN stops s2 ON st2.stop_id=s2.stop_id JOIN trips t ON st1.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id WHERE s1.parent_station != '' AND s2.parent_station != '' AND st2.row_number = (st1.row_number+1) AND r.route_desc LIKE 'Rapid Transit'"
  },
  RATP: {
    location: 'Paris',
    latitude: 48.8567,
    longitude: 2.3508,
    connectionString: 'postgres://thebusrider:3ll3board!@ratp-gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/ratp_gtfs',
    stops_view: "SELECT DISTINCT st.stop_id AS id, s.stop_name AS name, s.stop_lat AS latitude, s.stop_lon as longitude FROM stop_times st JOIN trips t ON st.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id JOIN stops s ON st.stop_id=s.stop_id WHERE r.route_type=1",
    routes_view: "SELECT DISTINCT st.stop_id AS stop_id, r.route_short_name AS route_id, r.route_color AS route_color FROM stop_times st JOIN trips t ON st.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id WHERE r.route_type=1",
    edges_view: "SELECT DISTINCT st1.stop_id AS origin, st2.stop_id AS destination, 'route' AS type, EXTRACT(EPOCH FROM st2.departure_time-st1.departure_time) AS duration FROM stop_times st1 JOIN stop_times st2 ON st1.trip_id = st2.trip_id JOIN trips t ON st1.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id WHERE st2.stop_sequence = (st1.stop_sequence+1) AND r.route_type=1 UNION SELECT from_stop_id AS origin, to_stop_id AS destination, 'transfer' AS type, min_transfer_time AS duration FROM transfers WHERE from_stop_id != to_stop_id UNION SELECT s1.id AS origin, s2.id AS destination, 'transfer' AS type, 0 AS duration FROM stops_view s1 JOIN stops_view s2 ON s1.name=s2.name AND s1.latitude=s2.latitude AND s1.longitude=s2.longitude AND s1.id!=s2.id AND s1.id>s2.id"
  }
};

module.exports = Systems;

},{}]},{},[667]);

require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({427:[function(require,module,exports){
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
    socket.on(_constants2.default.sendMergedStops, this._socketSendMergedStopsHandler);
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
  _socketSendMergedStopsHandler: function _socketSendMergedStopsHandler(mergedStops) {
    this.setState({ mergedStops: mergedStops });
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
    var numToReturn = arguments.length <= 1 || arguments[1] === undefined ? 10 : arguments[1];

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
    var _state = this.state;
    var hoverStop = _state.hoverStop;
    var mode = _state.mode;
    var origin = _state.origin;
    var destination = _state.destination;


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
    var _props = this.props;
    var infoBoxContents = _props.infoBoxContents;
    var mode = _props.mode;

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
        ': '
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
      '  ',
      this.props.stop.name,
      _react2.default.createElement(
        'div',
        { className: 'input-token-close', onClick: this.props.onTokenClose },
        '×'
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
      '  ',
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
      'Traversal Type: ',
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

},{"../../lib/constants.js":1,"../../lib/dom/index":2,"../../lib/systems.js":8,"classnames":21,"react":379,"react-addons-update":207,"react-dom":208,"react-onclickoutside":209,"socket.io-client":380}],209:[function(require,module,exports){
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
   * Generate the event handler that checks whether a clicked DOM node
   * is inside of, or lives outside of, our Component's node tree.
   */
  var generateOutsideCheck = function(componentNode, componentInstance, eventHandler, ignoreClass, preventDefault, stopPropagation) {
    return function(evt) {
      if (preventDefault) {
        evt.preventDefault();
      }
      if (stopPropagation) {
        evt.stopPropagation();
      }
      var current = evt.target;
      var found = false;
      // If source=local then this event came from 'somewhere'
      // inside and should be ignored. We could handle this with
      // a layered approach, too, but that requires going back to
      // thinking in terms of Dom node nesting, running counter
      // to React's 'you shouldn't care about the DOM' philosophy.
      while(current.parentNode) {
        found = isNodeFound(current, componentNode, ignoreClass);
        if(found) return;
        current = current.parentNode;
      }
      // If element is in a detached DOM, consider it 'not clicked
      // outside', as it cannot be known whether it was outside.
      if(current !== document) return;
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
  function setupHOC(root, React, ReactDOM) {

    // The actual Component-wrapping HOC:
    return function onClickOutsideHOC(Component, config) {
      var wrapComponentWithOnClickOutsideHandling = React.createClass({
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

        /**
         * Add click listeners to the current document,
         * linked to this component's state.
         */
        componentDidMount: function() {
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

          var fn = this.__outsideClickHandler = generateOutsideCheck(
            ReactDOM.findDOMNode(instance),
            instance,
            clickOutsideHandler,
            this.props.outsideClickIgnoreClass || IGNORE_CLASS,
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
            props[key] = passedProps[key];
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
      define(['react','react-dom'], function(React, ReactDom) {
        return factory(root, React, ReactDom);
      });
    } else if (typeof exports === 'object') {
      // Node. Note that this does not work with strict
      // CommonJS, but only CommonJS-like environments
      // that support module.exports
      module.exports = factory(root, require('react'), require('react-dom'));
    } else {
      // Browser globals (root is window)
      root.onClickOutside = factory(root, React, ReactDOM);
    }
  }

  // Make it all happen
  setupBinding(root, setupHOC);

}(this));

},{"react":379,"react-dom":208}],207:[function(require,module,exports){
module.exports = require('react/lib/update');
},{"react/lib/update":351}],351:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule update
 */

/* global hasOwnProperty:true */

'use strict';

var _prodInvariant = require('./reactProdInvariant'),
    _assign = require('object-assign');

var keyOf = require('fbjs/lib/keyOf');
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

var COMMAND_PUSH = keyOf({ $push: null });
var COMMAND_UNSHIFT = keyOf({ $unshift: null });
var COMMAND_SPLICE = keyOf({ $splice: null });
var COMMAND_SET = keyOf({ $set: null });
var COMMAND_MERGE = keyOf({ $merge: null });
var COMMAND_APPLY = keyOf({ $apply: null });

var ALL_COMMANDS_LIST = [COMMAND_PUSH, COMMAND_UNSHIFT, COMMAND_SPLICE, COMMAND_SET, COMMAND_MERGE, COMMAND_APPLY];

var ALL_COMMANDS_SET = {};

ALL_COMMANDS_LIST.forEach(function (command) {
  ALL_COMMANDS_SET[command] = true;
});

function invariantArrayCase(value, spec, command) {
  !Array.isArray(value) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'update(): expected target of %s to be an array; got %s.', command, value) : _prodInvariant('1', command, value) : void 0;
  var specValue = spec[command];
  !Array.isArray(specValue) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'update(): expected spec of %s to be an array; got %s. Did you forget to wrap your parameter in an array?', command, specValue) : _prodInvariant('2', command, specValue) : void 0;
}

/**
 * Returns a updated shallow copy of an object without mutating the original.
 * See https://facebook.github.io/react/docs/update.html for details.
 */
function update(value, spec) {
  !(typeof spec === 'object') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'update(): You provided a key path to update() that did not contain one of %s. Did you forget to include {%s: ...}?', ALL_COMMANDS_LIST.join(', '), COMMAND_SET) : _prodInvariant('3', ALL_COMMANDS_LIST.join(', '), COMMAND_SET) : void 0;

  if (hasOwnProperty.call(spec, COMMAND_SET)) {
    !(Object.keys(spec).length === 1) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Cannot have more than one key in an object with %s', COMMAND_SET) : _prodInvariant('4', COMMAND_SET) : void 0;

    return spec[COMMAND_SET];
  }

  var nextValue = shallowCopy(value);

  if (hasOwnProperty.call(spec, COMMAND_MERGE)) {
    var mergeObj = spec[COMMAND_MERGE];
    !(mergeObj && typeof mergeObj === 'object') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'update(): %s expects a spec of type \'object\'; got %s', COMMAND_MERGE, mergeObj) : _prodInvariant('5', COMMAND_MERGE, mergeObj) : void 0;
    !(nextValue && typeof nextValue === 'object') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'update(): %s expects a target of type \'object\'; got %s', COMMAND_MERGE, nextValue) : _prodInvariant('6', COMMAND_MERGE, nextValue) : void 0;
    _assign(nextValue, spec[COMMAND_MERGE]);
  }

  if (hasOwnProperty.call(spec, COMMAND_PUSH)) {
    invariantArrayCase(value, spec, COMMAND_PUSH);
    spec[COMMAND_PUSH].forEach(function (item) {
      nextValue.push(item);
    });
  }

  if (hasOwnProperty.call(spec, COMMAND_UNSHIFT)) {
    invariantArrayCase(value, spec, COMMAND_UNSHIFT);
    spec[COMMAND_UNSHIFT].forEach(function (item) {
      nextValue.unshift(item);
    });
  }

  if (hasOwnProperty.call(spec, COMMAND_SPLICE)) {
    !Array.isArray(value) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Expected %s target to be an array; got %s', COMMAND_SPLICE, value) : _prodInvariant('7', COMMAND_SPLICE, value) : void 0;
    !Array.isArray(spec[COMMAND_SPLICE]) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'update(): expected spec of %s to be an array of arrays; got %s. Did you forget to wrap your parameters in an array?', COMMAND_SPLICE, spec[COMMAND_SPLICE]) : _prodInvariant('8', COMMAND_SPLICE, spec[COMMAND_SPLICE]) : void 0;
    spec[COMMAND_SPLICE].forEach(function (args) {
      !Array.isArray(args) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'update(): expected spec of %s to be an array of arrays; got %s. Did you forget to wrap your parameters in an array?', COMMAND_SPLICE, spec[COMMAND_SPLICE]) : _prodInvariant('8', COMMAND_SPLICE, spec[COMMAND_SPLICE]) : void 0;
      nextValue.splice.apply(nextValue, args);
    });
  }

  if (hasOwnProperty.call(spec, COMMAND_APPLY)) {
    !(typeof spec[COMMAND_APPLY] === 'function') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'update(): expected spec of %s to be a function; got %s.', COMMAND_APPLY, spec[COMMAND_APPLY]) : _prodInvariant('9', COMMAND_APPLY, spec[COMMAND_APPLY]) : void 0;
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
}).call(this,require('_process'))
},{"./reactProdInvariant":345,"_process":11,"fbjs/lib/invariant":368,"fbjs/lib/keyOf":372,"object-assign":378}],21:[function(require,module,exports){
/*!
  Copyright (c) 2016 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/
/* global define */

(function () {
	'use strict';

	var hasOwn = {}.hasOwnProperty;

	function classNames () {
		var classes = [];

		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (!arg) continue;

			var argType = typeof arg;

			if (argType === 'string' || argType === 'number') {
				classes.push(arg);
			} else if (Array.isArray(arg)) {
				classes.push(classNames.apply(null, arg));
			} else if (argType === 'object') {
				for (var key in arg) {
					if (hasOwn.call(arg, key) && arg[key]) {
						classes.push(key);
					}
				}
			}
		}

		return classes.join(' ');
	}

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = classNames;
	} else if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
		// register as 'classnames', consistent with npm package name
		define('classnames', [], function () {
			return classNames;
		});
	} else {
		window.classNames = classNames;
	}
}());

},{}],8:[function(require,module,exports){
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
  }
};

module.exports = Systems;

},{}]},{},[427]);

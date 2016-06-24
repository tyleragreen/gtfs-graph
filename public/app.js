$(function() {
  const socketMsg = require('./constants.js');
  var Map = require('./map.js');
  
  var socket = io();
  
  var map = new Map(function() {
    socket.emit(socketMsg.sendStops);
  });
  
  socket.on('new edge', function(edge) {
    console.log(edge);
  });
  
  socket.on('stops', function(stopsGeoJson) {
    map.addStops(stopsGeoJson);
  });
  
  $('#btn-run').on('click', function() {
    socket.emit('start dfs', 'Back atcha!');
  })
});

$(function() {
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
  
  $('#btn-run').on('click', function() {
    map.clear();
    var msg = 'start ' + $('#type').val();
    socket.emit(msg, map.selectedStop);
  });
  
  $('#origin').on('input', function() {
    $('#suggestions').empty();
    if ($('#origin').val().length > 0) {
      $('#suggestions').show();
      let stops = map.getStops($('#origin').val());
      
      if (stops.length > 0) {
        stops.forEach(function(stop) {
          let listItem = '<li id="'+stop.name+'">';
          stop.routes.forEach(function(route) {
            listItem += '<img src="icons/' + route.toLowerCase() + '.png" />';
          });
          listItem += stop.name + '</li>';
          $("#suggestions").append(listItem);
        });
    
        $('#suggestions li').click(function() {
          $('#origin').val(this.id);
          $('#suggestions').hide();
        });
      } else {
        $('#suggestions').append("<li>No stops found!</li>");
      }
    } else {
      $('#suggestions').hide();
    }
    console.log('clicked');
  });
});

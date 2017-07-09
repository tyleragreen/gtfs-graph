'use strict';

var Stop = require('transit-tools').Stop;

function constructStop(stop) {
  return new Stop(
    stop.properties.id,
    stop.properties.name,
    stop.geometry.coordinates[1],
    stop.geometry.coordinates[0],
    stop.properties.routes
  );
}

function getStopList(stopsGeojson) {
  return stopsGeojson.features.map((stopGeojson) => {
    return constructStop(stopGeojson);
  });
}

module.exports = getStopList;
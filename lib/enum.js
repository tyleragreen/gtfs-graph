"use strict";

var utils = require('./utils');

function Enum(keys) {
  utils.checkType(keys, Array);
  
  const map = {};
  
  keys.forEach(key => {
    map[key] = key;
  });
  map.ALL = Object.values(map);
  map.default = {};
  
  map.isValid = function(key) {
    return map.hasOwnProperty(key);
  };
  
  return new Proxy(map, {
    get: (target, property) => {
      if (!map[property]) {
        throw new Error(`Member '${property}' not found on the Enum.`);
      }
      return map[property];
    },
    set: (target, property, value) => {
      throw new Error('Enum members may not be added.');
    }
  });
}

module.exports = Enum;
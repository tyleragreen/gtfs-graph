'use strict';

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
  // Using Enum.find(expr) is the same as Enum[expr]
  map.find = function(property) {
    return testProp(map, property);
  };
  
  function testProp(map, property) {
    if (!map[property]) {
      throw new Error(`Member '${property}' not found on the Enum.`);
    }
    return map[property];
  }
  
  return new Proxy(map, {
    get: (target, property) => {
      return testProp(map, property);
    },
    set: (target, property, value) => {
      throw new Error('Enum members may not be added.');
    }
  });
}

module.exports = Enum;
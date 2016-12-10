"use strict";

function Enum(keys) {
  const map = {};
  
  keys.forEach(key => {
    map[key] = Symbol.for(key);
  });
  map.ALL = Object.values(map);
  
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
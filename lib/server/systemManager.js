'use strict';

var System = require('./system');

class SystemManager {
  constructor() {
    this.systems = [];
  }
  
  add(system) {
    if (!(system instanceof System)) {
      throw 'bad system';
    }
    this.systems.push(system);
  }
  
  get(id) {
    let system = this.systems.filter(system => system.id === id);
    
    if (system.length !== 0) {
        throw 'system not found';
    }
    
    return system[0];
  }
}

module.exports = new SystemManager;
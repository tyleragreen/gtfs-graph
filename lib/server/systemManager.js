'use strict';

var System = require('./system');
var logger = require('./logger');

class SystemManager {
  constructor() {
    this.systems = [];
  }
  
  add(system) {
    logger.info('SystemManager: adding ', system);
    if (!(system instanceof System)) {
      throw 'bad system';
    }
    this.systems.push(system);
  }
  
  get(id) {
    logger.info('getting system: ' + id);
    let system = this.systems.filter(system => system.id === id);
    
    if (system.length !== 1) {
      logger.error('system not found: ' + id);
    }
    
    return system[0];
  }
}

module.exports = new SystemManager;
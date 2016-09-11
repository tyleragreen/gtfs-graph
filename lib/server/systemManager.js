'use strict';

var System = require('./system');
var TransitGraph = require('../graph/graph');
var logger = require('../logger');

class SystemManager {
  constructor() {
    this.systems = [];
  }
  
  add(system) {
    logger.info('SystemManager: adding ', system);
    if (!(system instanceof System)) {
      logger.error('bad system');
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
  
  setGraph(id, graph) {
    if (!(graph instanceof TransitGraph)) {
      logger.error('graph of wrong type');
    }
    let system = this.get(id);
    
    system.graph = graph;
  }
  
  getGraph(id) {
    let system = this.get(id);
    
    return system.graph;
  }
}

module.exports = new SystemManager;
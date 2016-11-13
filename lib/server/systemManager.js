'use strict';

var System = require('./system');
var TransitGraph = require('../graph/graph');
var logger = require('../logger');
var traversals = require('../graph/traversals.js');

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
  
  getInfo(id) {
    const system = this.get(id);
    
    return system.getInfo();
  }
  
  setGraph(id, graph) {
    if (!(graph instanceof TransitGraph)) {
      logger.error('graph of wrong type');
    }
    const system = this.get(id);
    
    system.graph = graph;
  }
  
  getGraph(id) {
    const system = this.get(id);
    
    return system.graph;
  }
  
  analyzeGraphs() {
    this.systems.forEach(function(system,index) {
      logger.info("Analyzing " + system.id);
      const graph = system.graph.getGraphToUse();
      
      system.graph.getGraphToUse().calculateRandomWalks(200, 50);
      system.graph.ranks = {};
      system.graph.ranks['Accessibility'] = traversals.outwardAccessibility(graph);
      system.graph.ranks['Page Rank'] = traversals.pageRank(graph);
      system.graph.ranks['Katz'] = traversals.katzCentrality(graph);
      system.graph.ranks['Closeness'] = traversals.closenessCentrality(graph);
      logger.info("Analyzing " + system.id + " complete.");
    });
    logger.info("All systems analyzed.");
  }
}

module.exports = new SystemManager;
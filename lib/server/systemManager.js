'use strict';

var System = require('./system');
var TransitGraph = require('../graph/graph');
var logger = require('../logger');
var traversals = require('../graph/traversals.js');
var utils = require('../utils');

const NUM_RANDOM_WALKS   = 50;
const RANDOM_WALK_LENGTH = 50;

class SystemManager {
  constructor() {
    this.systems = [];
  }
  
  add(system) {
    utils.checkType(system, System);
    logger.info('SystemManager: adding ', system);
    this.systems.push(system);
  }
  
  get(id) {
    logger.info('getting system: ' + id);
    let system = this.systems.filter(system => system.id.toLowerCase() === id.toLowerCase());
    
    if (system.length !== 1) {
      logger.error('system not found: ' + id);
    }
    
    return system[0];
  }
  
  systemExists(id) {
    return (typeof this.get(id) === "undefined") ? false : true;
  }
  
  getInfo(id) {
    const system = this.get(id);
    
    return system.getInfo();
  }
  
  setPrimaryGraph(id, graph) {
    this.setGraph(id, 'primary', graph);
  }
  
  setMergedGraph(id, graph) {
    this.setGraph(id, 'merged', graph);
  }
  
  setGraph(id, type, graph) {
    utils.checkType(graph, TransitGraph);
    const system = this.get(id);
    
    system.graphs[type] = graph;
  }
  
  getGraph(id, type) {
    if (type !== 'primary' && type !== 'merged' && type !== 'theoretical') {
      throw new Error('bad graph type='+type);
    }
    const system = this.get(id);
    
    return system.graphs[type];
  }
  
  analyzeGraphs() {
    let that = this;
    this.systems.forEach(function(system,index) {
      logger.info("Analyzing " + system.id);
      const graph = that.getGraph(system.id,'merged');//system.graph.getGraphToUse();
      
      graph.calculateRandomWalks(NUM_RANDOM_WALKS, RANDOM_WALK_LENGTH);
      graph.ranks = {};
      graph.ranks['Accessibility'] = traversals.outwardAccessibility(graph);
      graph.ranks['Page Rank'] = traversals.pageRank(graph);
      graph.ranks['Katz'] = traversals.katzCentrality(graph);
      graph.ranks['Closeness'] = traversals.closenessCentrality(graph);
    
      //system.graph.mergedGraph = traversals.findCriticalEdges(graph);
    
      logger.info("Analyzing " + system.id + " complete.");
    });
    logger.info("All systems analyzed.");
  }
}

module.exports = new SystemManager;
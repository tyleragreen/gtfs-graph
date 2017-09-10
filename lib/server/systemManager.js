'use strict';

var System = require('./system');
var TransitGraph = require('transit-tools').TransitGraph;
var logger = require('../logger');
var traversals = require('transit-tools').traversals;
var utils = require('../utils');
var Mode = require('../enums').Mode;
var GraphType = require('../enums').GraphType;

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
    logger.verbose(`${id}: getting system`);
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
    this.setGraph(id, GraphType.PRIMARY, graph);
  }
  
  setMergedGraph(id, graph) {
    this.setGraph(id, GraphType.MERGED, graph);
  }
  
  setGraph(id, type, graph) {
    utils.checkType(graph, TransitGraph);
    const system = this.get(id);
    
    system.graphs[type] = graph;
  }
  
  getGraph(id, type) {
    const system = this.get(id);
    const graph = system.graphs[type];
    
    if (typeof graph === "undefined") {
      throw new Error('graph does not exist! type='+type+' id='+id);
    }
    
    return graph;
  }
  
  analyzeGraphs() {
    this.systems.forEach((system,index) => {
      
      //-------------------------------------------------------
      logger.info(`${system.id}: Starting analysis`);
      const graph = this.getGraph(system.id, GraphType.MERGED);
      graph.ranks = {};
      
      //-------------------------------------------------------
      logger.info(`${system.id}: Calculating ${NUM_RANDOM_WALKS} random walks of length ${RANDOM_WALK_LENGTH}.`);
      graph.calculateRandomWalks(NUM_RANDOM_WALKS, RANDOM_WALK_LENGTH);
      
      //-------------------------------------------------------
      logger.info(`${system.id}: Calculating ${Mode.ACCESSIBILITY}.`);
      graph.ranks[Mode.ACCESSIBILITY] = traversals.outwardAccessibility(graph);
      
      //-------------------------------------------------------
      logger.info(`${system.id}: Calculating ${Mode.PAGE_RANK}.`);
      graph.ranks[Mode.PAGE_RANK] = traversals.pageRank(graph);
      
      //-------------------------------------------------------
      logger.info(`${system.id}: Calculating ${Mode.KATZ}.`);
      graph.ranks[Mode.KATZ] = traversals.katzCentrality(graph);
      
      //-------------------------------------------------------
      logger.info(`${system.id}: Calculating ${Mode.CLOSENESS}.`);
      graph.ranks[Mode.CLOSENESS] = traversals.closenessCentrality(graph);
      
      //-------------------------------------------------------
      // Calculate the theoretical graphs adding 1-5 new "routes"
      //for (let numRoutes = 1; numRoutes <= 5; numRoutes++) {
      //  let type = GraphType[`THEORETICAL-${numRoutes}R`];
      //  
      //  logger.info(`${system.id}: Calculating theoretical graph for ${type}.`);
      //  const theoreticalGraph = traversals.findCriticalEdges(graph, numRoutes);
      //  this.setGraph(system.id, type, theoreticalGraph);
      //}
    
      logger.info(`${system.id}: Analysis complete.`);
    });
    logger.info("");
    logger.info("=====================");
    logger.info("All systems analyzed.");
    logger.info("=====================");
  }
}

module.exports = new SystemManager;
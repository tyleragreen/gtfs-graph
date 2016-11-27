'use strict';

var logger = require('./logger');

var mean = function(list) {
  const rankSum = list.reduce(function(previousValue, currentValue, currentIndex, array) {
    return previousValue + currentValue;
  });
  return rankSum / list.length;
};

var stDev = function(list) {
  const variance = list.reduce(function(previousValue, currentValue, currentIndex, array) {
    return previousValue + Math.pow((currentValue - mean(list)),2);
  }) / list.length;
  return Math.sqrt(variance);
};

var rand = function(range) {
  return Math.floor(Math.random() * range);
};

var logRanks = function(graph, ranks) {
  let results = 'sep=;\n';
  ranks.forEach(function(rank, node) {
    const stop = graph.stops[node];
    logger.info("Rank of node " + node + " (" + stop.name + ") is " + rank);
    results += node + ';' + stop.id + ';' + stop.name + ';' + stop.routes + ';' + rank + '\n';
  });
  logger.info("Average Rank: " + mean(ranks));
  logger.info("Standard Deviation: " + stDev(ranks));
};

var checkType = function(item, klass) {
  if (!(item instanceof klass)) {
    throw new Error('Type check fail! Expected '+item+' to be type='+klass);
  }
};

module.exports = {
  mean: mean,
  stDev: stDev,
  rand: rand,
  logRanks: logRanks,
  checkType: checkType
};
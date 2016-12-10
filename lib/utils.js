'use strict';

var logger = require('./logger');

var assert = function(condition, errorMsg) {
  if (!condition) {
    throw new Error(errorMsg);
  }
};

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

var randPercent = function() {
  return rand(100);
};

var coinFlip = function() {
  const val = rand(2);
  if (val !== 0 && val !== 1) {
    throw new Error('bad coin flip');
  }
  return val === 0 ? true : false;
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

var errorToJson = function(msg) {
  return { "error": msg };
};

module.exports = {
  assert: assert,
  mean: mean,
  stDev: stDev,
  rand: rand,
  randPercent: randPercent,
  coinFlip: coinFlip,
  logRanks: logRanks,
  checkType: checkType,
  errorToJson: errorToJson
};
'use strict';

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

module.exports = {
  mean: mean,
  stDev: stDev,
  rand: rand
};
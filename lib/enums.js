'use strict';

const Enum = require('node-enums');

const Mode = Enum([
  'PAGE_RANK',
  'KATZ',
  'CLOSENESS',
  'ACCESSIBILITY'
]);

const Verbosity = Enum([
  'error',
  'info',
  'verbose',
  'debug',
  'silly'
]);

const GraphType = Enum([
  'PRIMARY',
  'MERGED',
  'THEORETICAL-1R',
  'THEORETICAL-2R',
  'THEORETICAL-3R',
  'THEORETICAL-4R',
  'THEORETICAL-5R'
]);

const Geometry = Enum([
  'LineString',
  'Point'
]);

const EdgeType = Enum([
  'ROUTE',
  'TRANSFER',
  'THEORETICAL'
]);

module.exports = {
  Mode: Mode,
  Verbosity: Verbosity,
  GraphType: GraphType,
  Geometry: Geometry,
  EdgeType: EdgeType
};
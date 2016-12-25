'use strict';

var Enum = require('./enum');

const Mode = Enum(['PAGE_RANK','KATZ','CLOSENESS','ACCESSIBILITY']);
const GraphType = Enum(['PRIMARY','MERGED','THEORETICAL']);
const Geometry = Enum(['LineString','Point']);
const EdgeType = Enum(['THEORETICAL','ROUTE','TRANSFER']);

module.exports = {
  Mode: Mode,
  GraphType: GraphType,
  Geometry: Geometry,
  EdgeType: EdgeType
};
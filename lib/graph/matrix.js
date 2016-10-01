'use strict';

class Matrix {
  constructor(length) {
    if (!length) {
      throw new Error('No length was provided!');
    }
    
    this.matrix = [];
    
    for (let i = 0; i < length; i++) {
      this.matrix.push([]);
      for (let j = 0; j < length; j++) {
        if (j < i) {
          this.matrix[i][j] = null;
        }
      }
    }
  }
  
  length() {
    return this.matrix.length;
  }
  
  get(vert, horz) {
    if (vert > (this.length() - 1) || horz > (this.length() - 1)) {
      throw new Error('get request out of bounds of matrix');
    }
    
    if (vert < horz) {
      return this.matrix[horz][vert];
    } else if (vert > horz) {
      return this.matrix[vert][horz];
    } else {
      return null;
    }
  }
  
  set(vert, horz, value) {
    if (vert > (this.length() - 1) || horz > (this.length() - 1)) {
      throw new Error('set request out of bounds of matrix');
    }
    
    if (vert < horz) {
      this.matrix[horz][vert] = value;
    } else if (vert > horz) {
      this.matrix[vert][horz] = value;
    } else {
      // This element should always be 0
      // FIXME add this assertion once you decide the dijkstra's implementation
      // if (value !== 0) { throw 'bad value'; }
    }
  }
  
  setRow(origin, distancesToOrigin) {
    let that = this;
    distancesToOrigin.forEach(function(distance, destination) {
      that.set(origin, destination, distance);
    });
  }
}

module.exports = Matrix;
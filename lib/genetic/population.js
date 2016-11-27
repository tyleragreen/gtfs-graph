'use strict';

var utils = require('../utils');

class Population {
  constructor(props) {
    const createSolution = props.createSolution;
    
    this.mutationRate = props.mutationRate;
    this.size = props.size;
    this.type = props.solutionType;
    this.calculateFitnessFunc = props.calculateFitness;
    this.solutions = [];
    
    for (let i=0; i<this.getSize(); i++) {
      const solution = createSolution(this.getSize());
      utils.checkType(solution,this.type);
      this.solutions.push(solution);
    }
  }
  
  getSize() {
    return this.size;
  }
  
  calculateFitness() {
    for (let i=0; i<this.getSize(); i++) {
      this.calculateFitnessFunc(this.solutions[i]);
    }
  }
}

module.exports = Population;
'use strict';

var utils = require('../utils');

class Population {
  constructor(props) {
    const createSolution = props.createSolution;
    if (props.mutationRate > 100 || props.mutationRate < 0) {
      throw new Error('invalid mutation rate ('+props.mutationRate+')');
    }
    
    this.mutationRate = props.mutationRate;
    this.size = props.size;
    this.type = props.solutionType;
    this.calculateFitnessFunc = props.calculateFitness;
    this.mutateSolution = props.mutateSolution;
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
  
  runGeneration() {
    this.sort();
    
    this.solutions[0].crossover(this.solutions[1]);
    
    for (let i=0; i<this.getSize(); i++) {
      if (utils.randPercent < this.mutationRate) {
        this.mutateSolution(this.solution[i]);
      }
    }
  }
}

module.exports = Population;
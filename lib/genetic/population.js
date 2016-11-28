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
    this.calculateFitness = props.calculateFitness;
    this.mutateSolution = props.mutateSolution;
    this.solutions = [];
    
    for (let i=0; i<this.getSize(); i++) {
      const solution = createSolution();
      utils.checkType(solution,this.type);
      this.solutions.push(solution);
    }
  }
  
  getSize() {
    return this.size;
  }
  
  sort() {
    let that = this;
    this.solutions.sort(function(a,b) {
      const fitA = that.calculateFitness(a);
      const fitB = that.calculateFitness(b);
      
      if (fitA < fitB) { 
        return -1;
      } else if (fitA > fitB) {
        return 1;
      } else {
        return 0;
      }
    });
  }
  
  runGeneration() {
    this.sort();
    console.log('solutions',this.solutions);
    
    this.solutions[0].crossover(this.solutions[1]);
    
    for (let i=0; i<this.getSize(); i++) {
      if (utils.randPercent < this.mutationRate) {
        this.mutateSolution(this.solution[i]);
      }
    }
  }
}

module.exports = Population;
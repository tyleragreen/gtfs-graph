'use strict';

var utils = require('../utils');

class Population {
  constructor(props) {
    const createSolution = props.createSolution;
    if (props.mutationRate > 100 || props.mutationRate < 0) {
      throw new Error('invalid mutation rate ('+props.mutationRate+')');
    }
    if (props.populationSize < 2) {
      throw new Error('invalid population size ('+props.populationSize+')');
    }
    
    this.mutationRate = props.mutationRate;
    this.populationSize = props.populationSize;
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
    return this.populationSize;
  }
  
  //-------------------------------------------------
  // Sort the solutions by fitness
  sort() {
    // Calculate the fitness of all the solutions.
    // We must do this for all because any could have experienced
    // a mutation that could change its fitness score.
    const fitnessSnapshot = this.solutions.map(solution => this.calculateFitness(solution));
    
    this.solutions.sort((a,b) => {
      const indexA = this.solutions.indexOf(a);
      const indexB = this.solutions.indexOf(b);
      const fitA = fitnessSnapshot[indexA];
      const fitB = fitnessSnapshot[indexB];
      
      if (fitA < fitB) { 
        return -1;
      } else if (fitA > fitB) {
        return 1;
      } else {
        return 0;
      }
    });
  }
  
  //-------------------------------------------------
  // Simulate a single generation of this population
  // 1) Sort by fitness
  // 2) Perform cross over on the two best parents
  // 3) Mutate a certain percent of solutions
  runGeneration() {
    this.sort();
    
    const crossoverList = this.solutions[0].crossover(this.solutions[1]);
    this.solutions.push(crossoverList);
    
    for (let i=0; i<this.getSize(); i++) {
      if (utils.randPercent < this.mutationRate) {
        this.mutateSolution(this.solution[i]);
      }
    }
  }
  
  //-------------------------------------------------
  runGenerations(numGenerations) {
    for (let i=0; i<numGenerations; i++) {
      this.runGeneration();
    }
    
    // Ensure we sort the solutions after the final generation
    this.sort();
  }
  
  //-------------------------------------------------
  getBestSolution() {
    return this.solutions[0];
  }
}

module.exports = Population;
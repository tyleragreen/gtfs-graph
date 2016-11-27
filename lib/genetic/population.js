'use strict';

class Population {
  constructor(props) {
    const createSolution = props.createSolution;
    
    this.mutationRate = props.mutationRate;
    this.size = props.size;
    this.solutions = [];
    
    for (let i=0; i<this.size; i++) {
      this.solutions.push(createSolution());
    }
//    console.log('solutions', this.solutions);
  }
}

module.exports = Population;
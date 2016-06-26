var EventQueue = function(periodicity, fireEvent) {
  this.queue = [];
  var self = this;
  
  this.timer = setInterval(function() {
    if (self.queue.length > 0) {
      fireEvent(self.queue);
    }
  }, periodicity);
};

EventQueue.prototype.push = function(event) {
  this.queue.push(event);
  
};

module.exports = EventQueue;

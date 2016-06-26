var EventQueue = function(fireEvent) {
  this.queue = [];
  var self = this;
  
  this.timer = setInterval(function() {
    if (self.queue.length > 0) {
      console.log('timer works');
      fireEvent();
    }
  }, 1000);
};

EventQueue.prototype.push = function(event) {
  this.queue.push(event);
  
};

module.exports = EventQueue;

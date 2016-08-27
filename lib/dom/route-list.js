import React from 'react';

export default React.createClass({
  render: function() {
    var routes = this.props.stop.routes.map(function(route) {
      return (
        <Icon key={route} id={route.toLowerCase()} />
      );
    });
    
    return (
      <span>{routes}</span>
    );
  }
});

var Icon = React.createClass({
  render: function() {
    var filename = '../files/' + this.props.id + '.png';
    return (
      <img src={filename} />
    );
  }
});

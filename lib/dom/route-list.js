import React from 'react';

export default React.createClass({
  render: function() {
    const { showIcons, stop, system } = this.props;
    
    let routes = stop.routes.map(function(route) {
      const key = stop.id + '-' + route.id;
      return (
        <Icon
          showIcon={showIcons}
          system={system}
          key={key}
          id={route.id.toLowerCase()}
          color={route.color}
        />
      );
    });
    
    return (
      <span>{routes}</span>
    );
  }
});

var Icon = React.createClass({
  render: function() {
    if (this.props.showIcon) {
      const filename = '/files/icons/' + this.props.system.toLowerCase() + '/' + this.props.id + '.png';
      
      return (
        <img src={filename} />
      );
    } else {
      let color = '#' + this.props.color;
      
      return (
        <svg height="16" width="16">
        <circle cx="8" cy="8" r="8" strokeWidth="0" fill={color} />
        </svg>
      );
    }
  }
});

import React from 'react';
import DOM from 'react-dom';

export default React.createClass({
  componentDidMount: function() {
    this.url = 'https://github.com/tyleragreen/gtfs-graph'; 
  },
  render: function() {
    const { url } = this;
    
    return (
      <a className="github-fork-ribbon left-bottom" target="_blank" href={url} title="Fork me on GitHub">
        Fork me on GitHub
      </a>
    );
  }
});
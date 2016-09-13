import React from 'react';

export default React.createClass({
  render: function() {
    let { text } = this.props;
    
    return (
      <div id='twitter-button'>
        <a href="https://twitter.com/share" className="twitter-share-button" data-text={text} data-url="https://gtfs-graph.herokuapp.com/" data-via="greent_tyler" data-show-count="false">
          Tweet
        </a>
        <script async src="//platform.twitter.com/widgets.js" charSet="utf-8"></script>
      </div>
    );
  }
});
import React from 'react';
import DOM from 'react-dom';

export default React.createClass({
  render: function() {
    const { id, label } = this.props;
  
    return (
      <button data-toggle="modal" data-target={'#'+id}>{label}</button>
    );
  }
});
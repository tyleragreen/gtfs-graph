import React from 'react';
import DOM from 'react-dom';

export default React.createClass({
  render: function() {
    const { id, label, classes } = this.props;
  
    return (
      <button className={'btn btn-primary ' + classes} data-toggle='modal' data-target={'#'+id}>{label}</button>
    );
  }
});
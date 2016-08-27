import React, { PropTypes } from 'react';
import DOM, { render, unmountComponentAtNode } from 'react-dom';
import MapboxGl from "mapbox-gl";

export default React.createClass({
  contextTypes: {
    map: PropTypes.object
  },
  componentDidMount: function() {
    this.div = document.createElement('div');
    this.popup = new MapboxGl.Popup({
      closeButton: false,
      closeOnClick: false
    });
    
    const { longitude, latitude, children } = this.props;
    const { map } = this.context;
    const { popup, div } = this;
    
    popup.setDOMContent(this.div);
    popup.setLngLat([longitude, latitude]);
    render(children, div, () => {
      popup.addTo(map);
    });
  },
  componentDidUpdate: function() {
    const { longitude, latitude, children } = this.props;
    const { popup, div } = this;
    
    popup.setLngLat([longitude, latitude]);
    render(children, div);
  },
  componentWillUnmount: function() {
    this.popup.remove();
    unmountComponentAtNode(this.div);
  },
  render: function() {
    return null;
  }
});
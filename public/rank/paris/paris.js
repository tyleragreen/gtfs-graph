import React from 'react';
import DOM from 'react-dom';
import GraphRankDisplay from '../app';

DOM.render(
  <GraphRankDisplay system='RATP' city='Paris' />,
  document.getElementById('content')
);
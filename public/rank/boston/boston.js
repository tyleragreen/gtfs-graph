import React from 'react';
import DOM from 'react-dom';
import PageRankDisplay from '../app';

DOM.render(
  <PageRankDisplay system='MBTA' />,
  document.getElementById('content')
);
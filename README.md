# gtfs-graph

gtfs-graph is a project to visually implement graph traversal algorithms on a MTA transit map.

# Structure

## Frontend

The client uses Mapbox GL JS to display a map of New York City, the MTA subway stops, and the edges between the subway stops. A socket-io socket connects to the backend on page load to receive the stops and edge data. A simple user interface sit atop the map to allow the user to send socket requests to the backend to begin a given traversal type. The traversal events are received over the socket by the client and added to a layer using Mapbox GL JS.

## Backend

gtfs-graph runs on a Node.js server. Before the server begins accepting requests, it queries a Postgres database to fetch the MTA transit stops and routes. A connectivity graph is created from the edges and the server boots up read to accept socket connections. The frontend is rendered using Express.

### Run Locally

After cloning the repository, be sure to install the necessary dependencies.

`npm install`

The following command will build the client JavaScript bundle and start the Node.js server.

`npm start`

### Special Thanks

Many thanks to [Jason Park](https://github.com/parkjs814) for the inspiration for this project. Check out his [Algorithm Visualizer](http://algo-visualizer.jasonpark.me/)!

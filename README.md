# gtfs-graph

gtfs-graph is a project to study transit system design using graph algorithms.

![Image](http://www.tyleragreen.com/blog_files/2016-10-gtfs-graph/routing1.png)

## Supported Algorithms

* Depth-First Search
* Breadth-First Search
* Dijkstra's Algorithm
* Page Rank
* Closeness Centrality

### Run Locally

After cloning the repository, be sure to install the necessary dependencies.

`npm install`

To build the JavaScript bundle which powers the front-end, run:

`npm run build-js`

Then start the Node.js server.

`npm start`

### Advanced Usage

Command-line options are available for `lib/server/index.js` to customize a run.

`--system` will load the server for only a single specified system. Default: all.
`node lib/server/index.js --system MBTA`

`--verbosity` will run the server at the specified verbosity. Default: info.
`node lib/server/index.js --verbosity verbose`

### Special Thanks

Many thanks to [Jason Park](https://github.com/parkjs814) for the inspiration for this project. Check out his [Algorithm Visualizer](http://algo-visualizer.jasonpark.me/)!

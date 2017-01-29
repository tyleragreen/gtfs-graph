# Graphs in Transit

A study of transit system design using graph theory.

<img src="http://www.tyleragreen.com/blog_files/2016-10-gtfs-graph/routing1.png" height="400">

## Two Frontends

Network Analysis: [https://gtfs-graph.herokuapp.com/](https://gtfs-graph.herokuapp.com/)
* Page Rank
* Closeness Centrality

Algorithm Demo: [https://gtfs-graph.herokuapp.com/demo/](https://gtfs-graph.herokuapp.com/demo/)
* Depth-First Search
* Breadth-First Search
* Dijkstra's Algorithm (Shortest Path Search)

## Usage

After cloning the repository, be sure to install the necessary dependencies.

`npm install`

There is an `npm` command to build the JavaScript bundle and start the Node.js server. These are not joined because the combine sequence takes longer than 60 seconds to complete, with is Heroku's limit on server boot time. See Other for the component commands.

`npm run all`

### Other

To build the JavaScript bundle without starting the server, run:

`npm run build-js`

Then, the Node.js server may be started.

`npm start`

### Advanced Usage

Command-line options are available for `lib/server/index.js` to customize a run.

`--system` will load the server for only a single specified system. Default: all.

`node lib/server/index.js --system MBTA`

`--verbosity` will run the server at the specified verbosity. Default: info.

`node lib/server/index.js --verbosity verbose`

## API

### Graph

`api/v0/graph/[system]?type=[type]&filter=[filter]&mode=[mode]`

| System |
|---|
|mbta|
|mta|
|ratp|

| Graph Type |
|---|
|primary|
|merged|
|theoretical-1r|
|theoretical-2r|
|theoretical-3r|
|theoretical-4r|
|theoretical-5r|

|Filter|
|---|
|stops|
|edges|

|Mode|
|---|
|accessibility|
|closeness|
|katz|
|page_rank|

### System

`api/v0/system/[system]`

## Special Thanks

Many thanks to [Jason Park](https://github.com/parkjs814) for the inspiration for this project. Check out his [Algorithm Visualizer](http://algo-visualizer.jasonpark.me/)!

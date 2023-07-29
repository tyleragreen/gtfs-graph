# Graphs in Transit

A study of transit system design using graph theory.

## Usage

`gtfs-graph` requires Node.js version 7.2.1.

After cloning the repository, be sure to install the necessary dependencies.

`npm install`

There is an `npm` command to build the JavaScript bundle and start the Node.js server. These are not joined because the combine sequence takes longer than 60 seconds to complete, with is Heroku's limit on server boot time. See Other for the component commands.

`npm run all`

### Test

A test suite of mostly unit tests is included. To run the tests:

`npm test`

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

|Mode (only valid if type==merged)|
|---|
|accessibility|
|closeness|
|katz|
|page_rank|

### System

`api/v0/system/[system]`

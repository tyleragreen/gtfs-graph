var Systems = {
  MTA: {
    latitude: 40.75,
    longitude: -73.96,
    connectionString: 'postgres://thebusrider:3ll3board!@mta-gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/mta_gtfs',
    stops_view: "SELECT stop_id AS id, stop_name AS name, stop_lat AS latitude, stop_lon AS longitude FROM stops WHERE stop_id NOT LIKE '%N' AND stop_id NOT LIKE '%S'",
    routes_view: "SELECT DISTINCT substring(st.stop_id from 0 for char_length(st.stop_id)) AS stop_id, r.route_id AS route_id FROM stop_times st JOIN trips t ON st.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id",
    edges_view: "SELECT DISTINCT substring(st1.stop_id from 0 for char_length(st1.stop_id)) AS origin, substring(st2.stop_id from 0 for char_length(st2.stop_id)) AS destination, 'route' AS type, EXTRACT(EPOCH FROM st2.departure_time-st1.departure_time) AS duration FROM stop_times st1 JOIN stop_times st2 ON st1.trip_id = st2.trip_id WHERE st2.stop_sequence = (st1.stop_sequence+1) UNION SELECT from_stop_id AS origin, to_stop_id AS destination, 'transfer' AS type, min_transfer_time AS duration FROM transfers WHERE from_stop_id != to_stop_id"
  },
  //MBTA: {
  //  latitude: 42.358056,
  //  longitude: -71.063611
  //}
};

module.exports = Systems;
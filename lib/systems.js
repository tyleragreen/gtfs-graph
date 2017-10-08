var Systems = {
  MTA: {
    location: 'New York City',
    latitude: 40.75,
    longitude: -73.96,
    connectionString: 'postgres://thebusrider:3ll3board!@mta-gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/mta_gtfs',
    stops_view: "SELECT stop_id AS id, stop_name AS name, stop_lat AS latitude, stop_lon AS longitude FROM stops WHERE stop_id NOT LIKE '%N' AND stop_id NOT LIKE '%S'",
    routes_view: "SELECT DISTINCT substring(st.stop_id from 0 for char_length(st.stop_id)) AS stop_id, r.route_id AS route_id, r.route_color AS route_color FROM stop_times st JOIN trips t ON st.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id",
    edges_view: "SELECT DISTINCT substring(st1.stop_id from 0 for char_length(st1.stop_id)) AS origin, substring(st2.stop_id from 0 for char_length(st2.stop_id)) AS destination, 'route' AS type, EXTRACT(EPOCH FROM st2.departure_time-st1.departure_time) AS duration FROM stop_times st1 JOIN stop_times st2 ON st1.trip_id = st2.trip_id WHERE st2.stop_sequence = (st1.stop_sequence+1) UNION SELECT from_stop_id AS origin, to_stop_id AS destination, 'transfer' AS type, min_transfer_time AS duration FROM transfers WHERE from_stop_id != to_stop_id"
  },
  MBTA: {
    location: 'Boston',
    latitude: 42.358056,
    longitude: -71.063611,
    connectionString: 'postgres://thebusrider:3ll3board!@gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/gtfs',
    stop_times_view: "SELECT row_number() OVER (), * FROM stop_times ORDER BY trip_id, stop_sequence",
    stops_view: "SELECT stop_id AS id, stop_name AS name, stop_lat AS latitude, stop_lon AS longitude FROM stops WHERE location_type='t'",
    routes_view: "SELECT DISTINCT s.parent_station AS stop_id, r.route_id AS route_id, r.route_color AS route_color FROM stop_times st JOIN trips t ON st.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id JOIN stops s ON st.stop_id=s.stop_id WHERE s.parent_station != '' AND r.route_desc LIKE 'Rapid Transit'",
    edges_view: "SELECT DISTINCT s1.parent_station AS origin, s2.parent_station AS destination, 'route' AS type, EXTRACT(EPOCH FROM st2.departure_time-st1.departure_time) AS duration FROM stop_times_view st1 JOIN stop_times_view st2 ON st1.trip_id = st2.trip_id JOIN stops s1 ON st1.stop_id=s1.stop_id JOIN stops s2 ON st2.stop_id=s2.stop_id JOIN trips t ON st1.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id WHERE s1.parent_station != '' AND s2.parent_station != '' AND st2.row_number = (st1.row_number+1) AND r.route_desc LIKE 'Rapid Transit'"
  },
  RATP: {
    location: 'Paris',
    latitude: 48.8567, 
    longitude: 2.3508,
    connectionString: 'postgres://thebusrider:3ll3board!@ratp-gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/ratp_gtfs',
    stops_view: "SELECT DISTINCT st.stop_id AS id, s.stop_name AS name, s.stop_lat AS latitude, s.stop_lon as longitude FROM stop_times st JOIN trips t ON st.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id JOIN stops s ON st.stop_id=s.stop_id WHERE r.route_type=1",
    routes_view: "SELECT DISTINCT st.stop_id AS stop_id, r.route_short_name AS route_id, r.route_color AS route_color FROM stop_times st JOIN trips t ON st.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id WHERE r.route_type=1",
    edges_view: "SELECT DISTINCT st1.stop_id AS origin, st2.stop_id AS destination, 'route' AS type, EXTRACT(EPOCH FROM st2.departure_time-st1.departure_time) AS duration FROM stop_times st1 JOIN stop_times st2 ON st1.trip_id = st2.trip_id JOIN trips t ON st1.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id WHERE st2.stop_sequence = (st1.stop_sequence+1) AND r.route_type=1 UNION SELECT from_stop_id AS origin, to_stop_id AS destination, 'transfer' AS type, min_transfer_time AS duration FROM transfers WHERE from_stop_id != to_stop_id UNION SELECT s1.id AS origin, s2.id AS destination, 'transfer' AS type, 0 AS duration FROM stops_view s1 JOIN stops_view s2 ON s1.name=s2.name AND s1.latitude=s2.latitude AND s1.longitude=s2.longitude AND s1.id!=s2.id AND s1.id>s2.id"
  },
  WMATA: {
    location: 'DC',
    latitude: 38.905, 
    longitude: -77.016,
    connectionString: 'postgres://thebusrider:3ll3board!@wmata-gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/wmata_gtfs',
    stops_view: "SELECT DISTINCT st.stop_id AS id, s.stop_name AS name, s.stop_lat AS latitude, s.stop_lon as longitude FROM stop_times st JOIN trips t ON st.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id JOIN stops s ON st.stop_id=s.stop_id WHERE r.route_type=1",
    routes_view: "SELECT DISTINCT st.stop_id AS stop_id, r.route_short_name AS route_id, r.route_color AS route_color FROM stop_times st JOIN trips t ON st.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id WHERE r.route_type=1",
    edges_view: "SELECT DISTINCT st1.stop_id AS origin, st2.stop_id AS destination, 'route' AS type, EXTRACT(EPOCH FROM st2.departure_time-st1.departure_time) AS duration FROM stop_times st1 JOIN stop_times st2 ON st1.trip_id = st2.trip_id JOIN trips t ON st1.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id WHERE st2.stop_sequence = (st1.stop_sequence+1) AND r.route_type=1"
  },
  WMATAP: {
    location: 'DC',
    latitude: 38.905, 
    longitude: -77.016,
  }
};

module.exports = Systems;
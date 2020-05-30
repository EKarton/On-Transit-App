"use strict";


class TripsLocator {

    /**
     * Constructs the TripsLocator object
     * @param {MongoClient} database 
     */
    constructor(database) {
        this.database = database;
    }


    /**
     * Get the most recent stop visited in a trip based on the current time.
     * The times[] contains the times which the bus / train will visit each stop,
     * where it has the format:
     * [ A1, A2, ..., An ]
     * 
     * where Ai is the arrival time for stop 'i'.
     * 
     * It will return two stop indexes, i, j, of which based on the time, 
     * the user could be between any stops between times[i] to times[j] inclusive
     * 
     * @param {Integer[][]} times The stop times for the trip
     * @param {Integer} curTime The current time
     * @returns {Integer} Index to the most recently visited stop.
     */
    getNearestStopIntervalsByTime(times, curTime) {
        let minStopIndex = Infinity;
        let maxStopIndex = -1;

        for (let i = 0; i < times.length - 1; i++) {
            let stopA = times[i];
            let stopB = times[i + 1];

            if (stopA <= curTime && curTime <= stopB) {

                minStopIndex = Math.min(minStopIndex, i);
                maxStopIndex = Math.max(maxStopIndex, i + 1);
            }
        }
        return [minStopIndex, maxStopIndex];
    }

    /**
     * Get a list of possible schedules the user might be on based on
     * the user's location, trip_id, and current time.
     * 
     * It will return a subset of the 'schedules' list as a set. 
     * @param {String} tripId A trip ID
     * @param {Integer} time The time in seconds from midnight
     * @param {Location} location The location
     * @returns {Set} A set of schedules the user might be in.
     */
    getPossibleSchedules(databaseName, tripId, time, location, pathLocations, pathInterval) {
        return new Promise(async (resolve, reject) => {

            let possibleSchedules = new Set();
            let schedulesCursor = await this.database.findSchedules(databaseName, tripId, time);

            while (await schedulesCursor.hasNext()) {
                let schedule = await schedulesCursor.next();

                let times = schedule.times;
                let locationIDs = schedule.locations;
                let scheduleID = schedule._id;

                // console.log("schedule_id:", scheduleID);

                // Get the range of stops that the user could be in
                let stopIntervals = this.getNearestStopIntervalsByTime(times, time);
                // console.log("stopIntervals:", stopIntervals);

                if (stopIntervals[1] == -1) {
                    continue;
                }

                // console.log(times, time, stopIntervals);

                // Get the range of path intervals based on the range of stops the user could be in
                let minPathIndex = Infinity;
                let maxPathIndex = -1;
                for (let i = stopIntervals[0]; i <= stopIntervals[1]; i++) {

                    let locationID = locationIDs[i];
                    let stopLocation = await this.database.findStopLocation(databaseName, locationID);

                    let pathInterval = this.getNearestPathSegmentsFromLocation(pathLocations, stopLocation);
                    // console.log("stop", i, ":", pathInterval);
                    minPathIndex = Math.min(minPathIndex, pathInterval[0]);
                    maxPathIndex = Math.max(maxPathIndex, pathInterval[1]);
                }

                if (minPathIndex > -1) {
                    if (minPathIndex <= pathInterval[0] && pathInterval[1] <= maxPathIndex) {
                        possibleSchedules.add(scheduleID);
                        // console.log("SUCCESS!---------------")
                    }
                }
            }

            resolve(possibleSchedules);
        });
    }

    /**
     * Given a path of points, it will return a line segment closest to the location
     * 
     * @param {List[Location]} path_locations 
     * @param {Location} location 
     */
    getNearestPathSegmentsFromLocation(path_locations, location) {
        let min_perp_vec_len_sqd = Infinity;
        let best_i = -1;

        for (let i = 0; i < path_locations.length - 1; i++) {
            let location_1 = path_locations[i];
            let location_2 = path_locations[i + 1];

            let segment = [location_2[0] - location_1[0], location_2[1] - location_1[1]];

            // Get the vector making location_1 to location_2
            let segment_len = Math.sqrt(segment[0] * segment[0] + segment[1] * segment[1]);

            // Get the vector making location to location_1
            let direction = [location.longitude - location_1[0], location.latitude - location_1[1]];

            // Compute the scalar projection of me2_vec onto location_vec
            let scalarProj = (segment[0] * direction[0] + segment[1] * direction[1]) / segment_len;

            // Calculate a2
            let perp_vec = [direction[0] - scalarProj * segment[0], direction[1] - scalarProj * segment[1]];
            let perp_vec_len_sqd = perp_vec[0] * perp_vec[0] + perp_vec[1] * perp_vec[1];

            if (0 <= scalarProj && scalarProj <= segment_len) {

                if (perp_vec_len_sqd < min_perp_vec_len_sqd) {
                    min_perp_vec_len_sqd = perp_vec_len_sqd;
                    best_i = i;
                }
            }
        }

        return [best_i, best_i + 1];
    }


    /**
     * Returns a list of trip IDs that are close to a certain location at a certain time.
     * @param {Location} location The current location
     * @param {int} time The time ellapsed from midnight
     * @param {int} radius The radius around the current location
     * @return {Promise} A promise. 
     *  When successful, it will pass the found trip IDs to the .resolve(); 
     *  else it will pass the error to .reject().
     */
    getTripIDsNearLocation(databaseName, location, time, radius) {
        return new Promise(async (resolve, reject) => {
            let latitude = location.latitude;
            let longitude = location.longitude;

            let responseObj = {};

            let nearbyPathsCursor = await this.database.findNearestPaths(databaseName, latitude, longitude, radius);

            while (await nearbyPathsCursor.hasNext()) {
                let nearbyPath = await nearbyPathsCursor.next();
                let pathID = nearbyPath.path_id;
                let pathLocations = nearbyPath.location.coordinates;

                let tripsCursor = await this.database.findTripsFromPathID(databaseName, pathID);

                let pathInterval = this.getNearestPathSegmentsFromLocation(pathLocations, location);

                while (await tripsCursor.hasNext()) {
                    let trip = await tripsCursor.next();

                    let tripId = trip.trip_id;
                    let possibleScheduleIDs = await this.getPossibleSchedules(databaseName, tripId, time, location, pathLocations, pathInterval);

                    if (possibleScheduleIDs.size > 0) {

                        responseObj[tripId] = {
                            shortname: trip.short_name,
                            longname: trip.long_name,
                            headsign: trip.headsign,
                            type: trip.type,
                            schedules: Array.from(possibleScheduleIDs)
                        }
                    }
                }
            }
            resolve(responseObj);
        });
    }

    getTransitIDsNearLocation(location, time, radius) {
        return new Promise(async (resolve, reject) => {
            let latitude = location.latitude;
            let longitude = location.longitude;

            console.log("Current time:" + time);
            console.log("Location: " + JSON.stringify(location));
            console.log("Radius: " + radius);

            let transitBoundingBoxCursor = await this.database.findNearestTransitAgencies(latitude, longitude);

            let responseObj = {};

            while (await transitBoundingBoxCursor.hasNext()) {
                let transitBoundingBox = await transitBoundingBoxCursor.next();
                let transitID = transitBoundingBox["transit_id"];

                let transitInfo = await this.database.getTransitInfo(transitID);
                let transitObjectID = transitInfo._id;
                let transitName = transitInfo["name"];
                let databaseName = transitName.replace(/[\s\\/$.\"]/g, "_");

                let results = await this.getTripIDsNearLocation(databaseName, location, time, radius);
                responseObj[transitObjectID] = {
                    name: transitInfo.name,
                    trips: results
                };
            }

            resolve(responseObj);
        })
    }
}

module.exports = TripsLocator;
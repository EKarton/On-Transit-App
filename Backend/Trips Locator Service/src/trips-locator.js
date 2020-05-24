"use strict";


class TripsLocator {

    /**
     * Constructs the TripsLocator object
     * @param {Database} database 
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
     * Determines a set of stops that the user might most recently visit based on the user's location.
     * The 'locationIDs' must be in the format:
     * [ S1, S2, ..., Sn ]
     * 
     * where S1 is the stop location ID for the first stop, S2 is the stop location ID for the second
     * stop, ..., Sn is the stop location ID for the last stop.
     * 
     * It will return a set of indexes to locationIDs[] that could be the most recently visited stop
     * 
     * @param {String[]} locationIDs A list of stop location IDs
     * @param {Location} location The current location
     * @returns {Set} The stop locations
     */
    getRecentStopsVisitedByLocation(locationIDs, location) {
        return new Promise(async (resolve, reject) => {

            let jobs = [];
            for (let i = 0; i < locationIDs.length - 1; i++) {
                let newJob = new Promise(async (resolveJob, rejectJob) => {
                    let locationID_1 = locationIDs[i];
                    let locationID_2 = locationIDs[i + 1];

                    let request1 = this.database.getObject("stop_locations", { "stop_id": locationID_1 });
                    let request2 = this.database.getObject("stop_locations", { "stop_id": locationID_2 });
                    let locations = await Promise.all([request1, request2]);

                    let location_1 = locations[0];
                    let location_2 = locations[1];

                    // Calculate the distance of the line segments
                    let dx = location_1.longitude - location_2.longitude;
                    let dy = location_1.latitude - location_2.latitude;
                    let lengthOfLine = Math.sqrt(dx * dx + dy * dy);

                    // Scalar project the current location to the line segment from (location_1 to location_2) and
                    let dot = (location.longitude - location_1.longitude) * dx + (location.latitude - location_1.latitude) * dy;
                    let scalarProj = dot / lengthOfLine;

                    let isProjectionInLine = 0 <= scalarProj && scalarProj <= lengthOfLine;

                    if (isProjectionInLine) {
                        resolveJob(i);
                    }
                    else {
                        resolveJob(null);
                    }
                });
                jobs.push(newJob);
            }
            let possibleStops = await Promise.all(jobs);
            possibleStops = possibleStops.filter(a => a !== null);
            let possibleStopsSet = new Set(possibleStops);

            resolve(possibleStopsSet);
        });
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
    getPossibleSchedules(tripId, time, location, pathLocations, pathInterval) {
        return new Promise(async (resolve, reject) => {

            let possibleSchedules = new Set();
            let schedulesCursor = await this.database.getInstance().collection("schedules").find({
                $and: [
                    { trip_id: { $eq: tripId } },
                    { start_time: { $lte: time } },
                    { end_time: { $gte: time } }
                ]
            });

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

                console.log(times, time, stopIntervals);

                // Get the range of path intervals based on the range of stops the user could be in
                let minPathIndex = Infinity;
                let maxPathIndex = -1;
                for (let i = stopIntervals[0]; i <= stopIntervals[1]; i++) {

                    let locationID = locationIDs[i];
                    let stopLocation = await this.database.getObject("stop_locations", { "stop_id": locationID });

                    let pathInterval = this.getNearestPathSegmentsFromLocation(pathLocations, stopLocation);
                    console.log("stop", i, ":", pathInterval);
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
    getTripIDsNearLocation(location, time, radius) {
        return new Promise(async (resolve, reject) => {
            let latitude = location.latitude;
            let longitude = location.longitude;

            console.log("Current time:" + time);
            console.log("Location: " + JSON.stringify(location));
            console.log("Radius: " + radius);

            let responseObj = {};

            let nearbyPathsCursor = await this.database.getInstance().collection("paths").find({
                location: {
                    $nearSphere: {
                        $geometry: {
                            type: "Point",
                            coordinates: [longitude, latitude]
                        },
                        $maxDistance: radius
                    }
                }
            });

            while (await nearbyPathsCursor.hasNext()) {
                let nearbyPath = await nearbyPathsCursor.next();
                let pathID = nearbyPath.path_id;
                let pathLocations = nearbyPath.location.coordinates;

                let tripsCursor = await this.database.getObjects("trips", {
                    "path_id": pathID
                });

                let pathInterval = this.getNearestPathSegmentsFromLocation(pathLocations, location);
                // console.log("pathInterval:", pathInterval, "pathId:", pathID);

                while (await tripsCursor.hasNext()) {
                    let trip = await tripsCursor.next();

                    let tripId = trip.trip_id;
                    let possibleScheduleIDs = await this.getPossibleSchedules(tripId, time, location, pathLocations, pathInterval);

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
}

module.exports = TripsLocator;
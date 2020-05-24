"use strict";

const Database = require("./database");
const Config = require("./res/config");

var database = undefined;

/**
 * Get the most recent stop visited in a trip based on the current time.
 * The times[] contains the times which the bus / train will visit each stop,
 * where it has the format:
 * [ [A1, D1], [A2, D2], ..., [An, Dn] ]
 * 
 * where [Ai, Di] contains the arrival time 'Ai' and the departure time 'Di'
 * for stop 'i'.
 * 
 * It will return the index to a stop (in the case above, it could be 'i').
 * 
 * @param {Integer[][]} times The stop times for the trip
 * @param {Integer} curTime The current time
 * @returns {Integer} Index to the most recently visited stop.
 */
function getRecentStopsVisitedByTime(times, curTime) {
    let possibleStop = -1;
    for (let i = 0; i < times.length - 1; i++) {
        let stopA = times[i];
        let stopB = times[i + 1];

        // console.log(stopA, stopB);

        if (stopA <= curTime && curTime <= stopB) {
            possibleStop = i;
            break;
        }
    }
    return possibleStop;
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
function getRecentStopsVisitedByLocation(locationIDs, location) {
    return new Promise(async (resolve, reject) => {

        let jobs = [];
        for (let i = 0; i < locationIDs.length - 1; i++) {
            let newJob = new Promise(async (resolveJob, rejectJob) => {
                let locationID_1 = locationIDs[i];
                let locationID_2 = locationIDs[i + 1];

                let request1 = database.getObject("stop_locations", { "stop_id": locationID_1 });
                let request2 = database.getObject("stop_locations", { "stop_id": locationID_2 });
                let locations = await Promise.all([request1, request2]);

                let location_1 = locations[0];
                let location_2 = locations[1];

                let dx = location_1.longitude - location_2.longitude;
                let dy = location_1.latitude - location_2.latitude;
                let lengthOfLineSquared = (dx * dx + dy * dy);
                let innerProduct = (location.longitude - location_2.longitude) * dx +
                    (location.latitude - location_2.latitude) * dy;

                let isProjectionInLine = 0 <= innerProduct && innerProduct <= lengthOfLineSquared;

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
function getPossibleSchedules(tripId, time, location) {
    return new Promise(async (resolve, reject) => {

        console.log("HEHE", tripId, time, typeof(time), location);

        let possibleSchedules = new Set();
        let schedulesCursor = await database.getInstance().collection("schedules").find({
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

            let stopRangesByLocation = await getRecentStopsVisitedByLocation(locationIDs, location);
            let recentStopVisitedByTime = getRecentStopsVisitedByTime(times, time);

            if (stopRangesByLocation.has(recentStopVisitedByTime)) {
                possibleSchedules.add(scheduleID);
            }
        }
        console.log("DONE");

        resolve(possibleSchedules);
    });
}


module.exports = {

    /**
     * Makes a connection to the database instance, as well as
     * other miscillaneous jobs to ensure successful shutdown and launch
     * of the app.
     */
    async run() {
        database = new Database();
        await database.connectToDatabase(Config.DATABASE_URI, Config.DATABASE_NAME);

        process.on("SIGINT", async () => {
            await database.closeDatabase();
            process.exit(-1);
        });

        process.on("exit", async () => {
            await database.closeDatabase();
        });
    },

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

            let nearbyPathsCursor = await database.getInstance().collection("paths").find({
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

                let tripsCursor = await database.getObjects("trips", {
                    "path_id": pathID
                });
                while (await tripsCursor.hasNext()) {
                    let trip = await tripsCursor.next();
                    
                    let tripId = trip.trip_id;
                    let possibleScheduleIDs = await getPossibleSchedules(tripId, time, location);

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
};

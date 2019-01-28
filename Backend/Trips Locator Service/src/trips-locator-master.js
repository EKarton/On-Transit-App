const Database = require("on-transit").Database;
const Location = require("on-transit").Location;
const Config = require("./res/config");

class TripsLocatorMasterV3 {

    /**
     * Initializes the Trips Locator with the database
     * @param {Database} database A database
     */
    constructor(database){
        this.database = database;
    }

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
    getRecentStopsVisitedByTime(times, curTime){
        let possibleStop = -1;
        for (let i = 0; i < times.length - 1; i++){
            let stopA = times[i];
            let stopB = times[i + 1];

            if (stopA[1] <= curTime && curTime <= stopB[0]){
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
    getRecentStopsVisitedByLocation(locationIDs, location){
        return new Promise(async (resolve, reject) => {

            let jobs = [];
            for (let i = 0; i < locationIDs.length - 1; i++){
                let newJob = new Promise(async (resolveJob, rejectJob) => {
                    let locationID_1 = locationIDs[i];
                    let locationID_2 = locationIDs[i + 1];
                    
                    let request1 = this.database.getObject("stop-locations", { "_id": locationID_1 });
                    let request2 = this.database.getObject("stop-locations", { "_id": locationID_2 });
                    let locations = await Promise.all([request1, request2]);

                    let location_1 = locations[0];
                    let location_2 = locations[1];

                    let dx = location_1.longitude - location_2.longitude;
                    let dy = location_1.latitude - location_2.latitude;
                    let lengthOfLineSquared = (dx * dx + dy * dy);
                    let innerProduct = (location.longitude - location_2.longitude) * dx + 
                                       (location.latitude - location_2.latitude) * dy;
                    
                    let isProjectionInLine = 0 <= innerProduct && innerProduct <= lengthOfLineSquared;

                    if (isProjectionInLine){
                        resolveJob(i);
                    }
                    else{
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
     * Get a subset from the list of possible schedules the user might be on based on
     * the user's location and current time.
     * 
     * It will return a subset of the 'schedules' list as a set. 
     * @param {String[]} schedules A list of possible schedules
     * @param {Integer} time The time in seconds from midnight
     * @param {Location} location The location
     * @returns {Set} A set of schedules the user might be in.
     */
    getPossibleSchedules(tripScheduleIDs, time, location){
        return new Promise(async (resolve, reject) => {

            let possibleSchedules = new Set();
            let schedulesAggregatorCursor = await this.database.getAggregatedObjects("schedules", [
                {
                    $match: {
                        $and: [
                            { _id: { $in: tripScheduleIDs } },
                            { startTime: { $lte: time } },
                            { endTime: { $gte: time } } 
                        ]
                    }
                },
                {
                    $group: {
                        _id: {
                            "headsigns": "$headsigns",
                            "locationIDs": "$locationIDs"
                        },
                        times: { $push: "$times" },
                        scheduleIDs: { $push: "$_id" }
                    }
                }
            ]);
            while (await schedulesAggregatorCursor.hasNext()){
                let aggregatedSchedule = await schedulesAggregatorCursor.next();

                // console.log(" ====================== AGGREGATED SCHEDULE ==============================");
                // console.log(JSON.stringify(aggregatedSchedule));

                let times = aggregatedSchedule.times;
                let locationIDs = aggregatedSchedule._id.locationIDs;
                let scheduleIDs = aggregatedSchedule.scheduleIDs;

                let stopRangesByLocation = await this.getRecentStopsVisitedByLocation(locationIDs, location);

                // console.log("Recent stops visited by location");
                // console.log(JSON.stringify(Array.from(stopRangesByLocation)));

                // console.log("WASD:");
                // console.log(await this.getStopRangesByTime(times, time));

                for (let i = 0; i < times.length; i++){
                    let tripSchedule = times[i];
                    let tripScheduleID = scheduleIDs[i];
                    let recentStopVisitedByTime = this.getRecentStopsVisitedByTime(tripSchedule, time);

                    // console.log("Recent stops visited per schedule by time: " + recentStopVisitedByTime);

                    if (recentStopVisitedByTime >= 0){
                        if (stopRangesByLocation.has(recentStopVisitedByTime)){
                            possibleSchedules.add(tripScheduleID);
                        }
                        else if (stopRangesByLocation.has(recentStopVisitedByTime - 1)){
                            possibleSchedules.add(tripScheduleID);
                        }
                        else if (stopRangesByLocation.has(recentStopVisitedByTime + 1)){
                            possibleSchedules.add(tripScheduleID);
                        }
                    }
                }
            }

            resolve(possibleSchedules);
        });
    }

    /**
     * Returns a list of trip IDs that are close to a certain location at a certain time.
     * @param {Location} location The current location
     * @param {int} time The time ellapsed from midnight
     * @return {Promise} A promise. 
     *  When successful, it will pass the found trip IDs to the .resolve(); 
     *  else it will pass the error to .reject().
     */
    getTripIDsNearLocation(location, time, radius){
        return new Promise(async (resolve, reject) => {
            let latitude = location.latitude;
            let longitude = location.longitude;
            // console.log("Current time:" + time);
            // console.log("Location: " + JSON.stringify(location));

            let responseObj = {};

            let nearbyPathsCursor = await this.database.getObjects("paths", { 
                location: { 
                    $nearSphere: { 
                        $geometry: { 
                            type: "Point", 
                            coordinates: [ longitude, latitude ] 
                        }, 
                        $maxDistance: radius 
                    } 
                } 
            });

            while (await nearbyPathsCursor.hasNext()){
                let nearbyPath = await nearbyPathsCursor.next();
                let pathID = nearbyPath._id;

                let tripsCursor = await this.database.getObjects("trips", {
                    "pathID": pathID
                });
                while (await tripsCursor.hasNext()){
                    let trip = await tripsCursor.next();

                    // console.log(" ============================ TRIP =================================");
                    // console.log(JSON.stringify(trip));

                    let schedules = trip.schedules;
                    let possibleScheduleIDs = await this.getPossibleSchedules(schedules, time, location);

                    if (possibleScheduleIDs.size > 0){

                        responseObj[trip._id] = {
                            shortname: trip.shortName,
                            longname: trip.longName,
                            headsign: trip.headSign,
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

module.exports = TripsLocatorMasterV3;
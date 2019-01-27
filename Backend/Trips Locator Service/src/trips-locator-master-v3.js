const Database = require("on-transit").Database;
const Location = require("on-transit").Location;
const PathLocationsTree = require("on-transit").PathLocationTree;
const Config = require("./res/config");
const Process = require("process");

class TripsLocatorMasterV3 {

    /**
     * Initializes the Trips Locator with the database
     * @param {Database} database A database
     */
    constructor(database){
        this.database = database;
    }

    /**
     * Determines which two stops each trip in 'times' lies on based on the 
     * current time.
     * The 'times' param must be a 2D matrix that looks like:
     * 
     * [
     *      [[1A1, 1D1], [1A2, 1D2], ..., [1An, 1Dn]],
     *      [[2A1, 2D1], [2A2, 2D2], ..., [2An, 2Dn]],
     *      ...
     *      [[TA1, TD1], [TA2, TD2], ..., [TAn, TDn]],
     * ]
     * where each row corresponds to a trip, and each column represents the arrival / departure time
     * of each stop.
     * 
     * Each trip must cover the same number of stops (hence the "n" param).
     * 
     * @param {Object[][]} times The times per trip
     * @param {Integer} time The current time in seconds
     */
    getStopRangesByTime(times, time){
        return new Promise(async (resolve, reject) => {
            let stopRangesPerTrip = [];
            for (let i = 0; i < times.length; i++){
                for (let j = 0; j < times[i].length - 1; j++){
                    let stopTimeA = times[i][j];
                    let stopTimeB = times[i][j + 1];

                    if (stopTimeA[1] <= time && time <= stopTimeB[0]){
                        let newStopRange = [j, j + 1];
                        stopRangesPerTrip.push(newStopRange);
                    }
                }
            }
            resolve(stopRangesPerTrip);
        });
    }

    /**
     * Determines a set of two adjacent stop locations the user with location 'location' can be in.
     * The 'locationIDs' must be in the format:
     * [ S1, S2, ..., Sn ]
     * 
     * where S1 is the stop location ID for the first stop, S2 is the stop location ID for the second
     * stop, ..., Sn is the stop location ID for the last stop.
     * 
     * It will return a list of lists in the format:
     * [
     *      [A1, A1 + 1],
     *      [A2, A2 + 1],
     *      ...
     *      [Am, Am + 1]
     * ]
     * 
     * where [Ai, Ai + 1] is a possible pair of two adjacent stop locations. 
     * @param {String[]} locationIDs A list of stop location IDs
     * @param {Location} location The current location
     * @returns {Integer[][]} The stop locations
     */
    getStopRangesByLocation(locationIDs, location){
        return new Promise(async (resolve, reject) => {

            let jobs = [];
            for (let i = 0; i < locationIDs.length - 1; i++){
                let newJob = new Promise(async (resolveJob, rejectJob) => {
                    let locationID_1 = locationIDs[i];
                    let locationID_2 = locationIDs[i + 1];

                    console.log("Location ID 1:" + locationID_1);
                    
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
                        resolveJob([i, i + 1]);
                    }
                    else{
                        resolveJob([]);
                    }
                });
                jobs.push(newJob);
            }
            let rawResults = await Promise.all(jobs);
            let finalResults = rawResults.filter(a => a.length == 2);
            resolve(finalResults);
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
    getTripIDsNearLocation(location, time, radius = 5){
        return new Promise(async (resolve, reject) => {
            let latitude = location.latitude;
            let longitude = location.longitude;

            let responseObj = {};

            let nearbyPathsCursor = await this.database.getObjects("paths", { 
                location: { 
                    $nearSphere: { 
                        $geometry: { 
                            type: "Point", 
                            coordinates: [ longitude, latitude ] 
                        }, 
                        $maxDistance: 30 
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
                    let schedules = trip.schedules;

                    let schedulesAggregatorCursor = await this.database.getAggregatedObjects("schedules", [
                        {
                            $match: {
                                "_id": { $in: schedules },
                                "startTime": { $lte: time },
                                "endTime": { $gte: time }
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    "headsigns": "$headsigns",
                                    "locationIDs": "$locationIDs"
                                },
                                times: { $push: "$times" },
                            }
                        }
                    ]);
                    while (await schedulesAggregatorCursor.hasNext()){
                        let aggregatedSchedule = await schedulesAggregatorCursor.next();
                        console.log(JSON.stringify(aggregatedSchedule));

                        let times = aggregatedSchedule.times;
                        let locationIDs = aggregatedSchedule._id.locationIDs;

                        let stopRangesByLocation_Promise = this.getStopRangesByLocation(locationIDs, location);
                        let stopRangesByTime_Promise = this.getStopRangesByTime(times, time);

                        let results = await Promise.all([stopRangesByLocation_Promise, stopRangesByTime_Promise]);
                        let stopRangesByLocation = results[0];
                        let stopRangesByTime = results[1];

                        console.log("Stop Ranges by Location:");
                        console.log(stopRangesByLocation);

                        console.log("Stop Ranges by Time:");
                        console.log(stopRangesByTime);

                        let commonStopRanges = [];
                        for (let i = 0; i < stopRangesByTime.length; i++){
                            let curStopRange = stopRangesByTime[i];
                            let stopRange_1 = stopRangesByLocation.filter(item => item[0] === curStopRange[0] && item[1] === curStopRange[1]);
                            if (stopRange_1.length > 0){
                                commonStopRanges.push(curStopRange);
                            }
                        }
                        console.log("The intersection of the two");
                        console.log(commonStopRanges);

                        if (commonStopRanges.length > 0){
                            console.log("I AM HERE");
                        }
                    }
                }
            }
            resolve();
        });
    }
}

module.exports = TripsLocatorMasterV3;
const Database = require("on-transit").Database;
const Location = require("on-transit").Location;
const PathLocationsTree = require("on-transit").PathLocationTree;
const Config = require("./res/config");
const Process = require("process");

class TripsLocatorMasterV2 {

    /**
     * Initializes the Trips Locator with the database
     * @param {Database} database A database
     */
    constructor(database){
        this.database = database;
    }

    /**
     * Calculates and determines the stop schedules that are in between the "time".
     * Pre-condition:
     * - "stopSchedules" must be an array of objects with each object in this format:
     *   {
     *      arrivalTime: <ARRIVAL_TIME_IN_SECONDS_FROM_12:00AM>,
     *      departTime: <DEPART_TIME_IN_SECONDS_FROM_12:00AM>
     *   }
     * - "time" must be the number of seconds from 12:00 AM
     * 
     * Post-condition:
     * - Returns an object in this format:
     *   {
     *       prevStopSchedule: <The stop schedule right before "time">,
     *       nextStopSchedule: <<The stop schedule right after "time">>
     *   }
     * 
     * @param {object[]} stopSchedules A list of stop schedules in a format as mentioned above.
     * @param {int} time The time in seconds ellapsed since 12:00 AM
     * @return {object} Returns two stop schedules from "stopSchedules" that are in between "time" 
     *  in the format as mentioned above.
     */
    getNeighbouringStopSchedules(stopSchedules, time){
    	var prevStopSchedule = null;
        var nextStopSchedule = null;

        // Since the stop schedules are in sorted order we can perform binary search
        var left = 0;
        var right = stopSchedules.length - 1;
        while (left <= right){
        	var mid = Math.floor((left + right) / 2);

        	var leftStopSchedule = stopSchedules[mid];
        	var rightStopSchedule = stopSchedules[mid + 1];

        	// When we found it
        	if (leftStopSchedule.arrivalTime <= time && time <= rightStopSchedule.departTime){
        		prevStopSchedule = leftStopSchedule;
                nextStopSchedule = rightStopSchedule;
                break;
        	}

        	else if (time > rightStopSchedule.departTime){
        		left = mid + 1;
        	}
        	else{
        		right = mid - 1;
        	}
        }

        return {
        	prevStopSchedule: prevStopSchedule,
        	nextStopSchedule: nextStopSchedule
        };
    }

    /**
     * 
     * @param {*} trip 
     * @param {*} path 
     * @param {*} location 
     * @param {*} time 
     */
    getNearbyTripIDsOnTrip(trip, path, location, time){

        return new Promise((resolve, reject) => {
            console.log("Got a trip " + trip._id + " for path " + path._id + " \t Mem. usage: " + Process.memoryUsage().heapUsed / 1024 / 1024);
            let schedulePromise = this.database.getObject("schedules", {
                "_id": trip._id,
                "startTime": { $lte: time },
                "endTime": { $gte: time }
            });

            schedulePromise.then(schedule => {
                if (schedule){
                    if (schedule !== null){
                        resolve(schedule);
                    }
                    else{
                        resolve(null);
                    }                    
                }
                resolve(null);
            }).catch(error => {
                if (error){
                    console.error("ERROR: " + error);
                    reject(error);
                }
                resolve(null);
            });
        });
    }

    getNearbyTripIDsOnPath(path, location, time){
        return new Promise(async (resolve, reject) => {
            let tripsCursor = this.database.getObjects("trips", {
                "pathID": path._id
            });

            let tripPromises = [];
            while(await tripsCursor.hasNext()){
                let trip = await tripsCursor.next();
                let tripPromise = this.getNearbyTripIDsOnTrip(trip, path, location, time);
                tripPromises.push(tripPromise);
            }

            Promise.all(tripPromises).then(results => {
                let filteredResults = results.filter(o => o !== null);
                resolve(filteredResults);
            }).catch(error => {
                reject(error);
            });
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
    getTripIDsNearLocation(location, time){

        let x = location.longitude * 1000000;
        let y = location.latitude * 1000000;

        let jobBatchPromise = new Promise(async (resolve, reject) => {
            let pathTreesCursor = this.database.getObjects("path-trees", {
                'tree.minX': { $lte: x }, 
                'tree.minY': { $lte: y }, 
                'tree.maxX': { $gte: x }, 
                'tree.maxY': { $gte: y }
            }).batchSize(200);

            let pathPromises = [];
            while (await pathTreesCursor.hasNext()){
                let path = await pathTreesCursor.next();
                let pathTree = new PathLocationsTree(path.tree);
                let unsortedPathLocations = pathTree.getAllLocations();
                var sortedPathLocations = unsortedPathLocations.sort((a, b) => {
                    var sequenceA = a.sequence;
                    var sequenceB = b.sequence;

                    if (sequenceA < sequenceB){
                        return -1;
                    }
                    else{
                        return 1;
                    }
                });

                let pathObj = {
                    _id: path._id,
                    pathLocations: sortedPathLocations
                };

                let pathPromise = this.getNearbyTripIDsOnPath(pathObj, location, time);

                pathPromises.push(pathPromise);
            }

            Promise.all(pathPromises).then(results => {
                let mergedResults = [].concat.apply([], results);
                resolve(mergedResults);
            }).catch(error => {
                reject(error);
            });
        });
        return jobBatchPromise;
    }
}

module.exports = TripsLocatorMasterV2;
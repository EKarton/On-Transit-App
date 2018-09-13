"use strict";

const Database = require("on-transit").Database;
const PathLocationsTree = require("on-transit").PathLocationTree;
const Location = require("on-transit").Location;

/**
 * A class used to locate the trip IDs based on a user's 
 * GPS location and time.
 */
class TripsLocator{

    /**
     * Initializes the TripsLocator
     * @param {Database} database A database used to obtain transit data
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
     *       previousStopSchedule: <The stop schedule right before "time">,
     *       nextStopSchedule: <<The stop schedule right after "time">>
     *   }
     * 
     * @param {object[]} stopSchedules A list of stop schedules in a format as mentioned above.
     * @param {int} time The time in seconds ellapsed since 12:00 AM
     * @return {object} Returns two stop schedules from "stopSchedules" that are in between "time" 
     *  in the format as mentioned above.
     */
    async _getNeighbouringStopSchedules(stopSchedules, time){
    	var prevStopSchedule = null;
        var nextStopSchedule = null;

        // Since the stop schedules are in sorted order we can perform binary search
        var left = 0;
        var right = stopSchedules.length - 2;
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
        		right = mid;
        	}
        }

        return {
        	previousStopSchedule: prevStopSchedule,
        	nextStopSchedule: nextStopSchedule
        };
    }

    /**
     * Returns a list of trip IDs from the database that are near
     * the current location and it is in between two times.
     * 
     * @param {Location} location The location
     * @param {int} time The time, which is the number of seconds from 12:00AM
     * @return {Promise} A promise, with the list of trip IDs passed to .then().
     *  If an error were to occur, that error is passed to .catch().
     */
    getTripIDsNearLocation(location, time){
        return new Promise(async (resolve, reject) => {
            try{
                var tripIDs = [];

                var cursor = this.database.getObjects("schedules", {
                    startTime: { $lte: time },
                    endTime: { $gte: time }
                });
                while (await cursor.hasNext()){
                    var schedule = await cursor.next();
                    var stopSchedules = schedule.stopSchedules;

                    // Get two stop schedules which is immediately before and after the current time.
                    var neighbouringStopSchedules = await this._getNeighbouringStopSchedules(stopSchedules, time);
                    var prevStopSchedule = neighbouringStopSchedules.previousStopSchedule;
                    var nextStopSchedule = neighbouringStopSchedules.nextStopSchedule;

                    var prevPathLocationSequence = prevStopSchedule.pathLocationIndex;
                    var nextPathLocationSequence = nextStopSchedule.pathLocationIndex;

                    // Find the trips associated with this schedule
                    var tripsCursor = this.database.getObjects("trips", {
                        "_id": schedule._id
                    });

                    while (await tripsCursor.hasNext()){
                        var trip = await tripsCursor.next();
                        var tripID = trip._id;
                        var pathID = trip.pathID;

                        var path = await this.database.getObject("path-trees", { "_id": pathID });
                        var pathTree = new PathLocationsTree(path.tree);
                        var closestPathLocation = pathTree.getNearestLocation(location);

                        if (prevPathLocationSequence <= closestPathLocation.sequence){
                            if (closestPathLocation.sequence <= nextPathLocationSequence){
                                tripIDs.push(tripID);
                            }
                        }
                    }
                }
                console.log("done");
                resolve(tripIDs);
            }
            catch(error){
                console.log(error);
                reject(error);
            }
        });
        
    }
}

module.exports = TripsLocator;
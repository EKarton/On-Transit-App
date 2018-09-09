"use strict";

const Database = require("on-transit").Database;
const PathLocationsTree = require("on-transit").PathLocationTree;

class TripsLocator{
    constructor(database){
        this.database = database;
    }

    async _getNeighbouringStopSchedules(stopSchedules){
    	var prevStopSchedule = null;
        var nextStopSchedule = null;

        // Since the stop schedules are in sorted order we can perform binary search
        var left = 0;
        var right = stopSchedules.length - 2;
        while (left <= right){
        	var mid = (left + right) / 2;

        	var leftStopSchedule = stopSchedules[mid];
        	var rightStopSchedule = stopSchedules[mid + 1];

        	// When we found it
        	if (leftStopSchedule.arrivalTime <= time && time <= rightStopSchedule.departTime){
        		prevStopSchedule = leftStopSchedule;
        		nextStopSchedule = rightStopSchedule;
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

    async getTripIDsNearLocation(location, time){
        var tripIDs = [];

        var cursor = this.database.getObjects("schedules", {
            startTime: { $lte: time },
            endTime: { $gte: time }
        });
        while (await cursor.hasNext()){
            var schedule = await cursor.next();
            var stopSchedules = schedule.stopSchedules;

            // Get two stop schedules which is immediately before and after the current time.
            var neighbouringStopSchedules = this._getNeighbouringStopSchedules(stopSchedules);
            var prevStopSchedule = neighbouringStopSchedules.previousStopSchedule;
            var nextStopSchedule = neighbouringStopSchedules.nextStopSchedule;

            var prevPathLocationSequence = prevStopSchedule.pathLocationIndex;
            var nextPathLocationSequence = nextStopSchedule.pathLocationIndex;

            // Find the trips associated with this schedule
            var tripsCursor = this.database.getObjects("trips", {
            	"stopID": schedule._id
            });

            var validTripIDs = [];
            while (await tripsCursor.hasNext()){
            	var trip = await tripsCursor.next();
            	var tripID = trip._id;
            	var pathID = trip.pathID;

            	var path = await this.database.getObject("path-trees", { "_id": pathID });
            	var pathTree = new PathLocationsTree(path.tree);
            	var closestPathLocation = pathTree.getNearestLocation(location);

            	if (prevPathLocationSequence <= closestPathLocation.sequence){
            		if (closestPathLocation.sequence <= nextPathLocationSequence){
            			validTripIDs.push(tripID);
            		}
            	}
            }

            tripIDs.push(validTripIDs);
        }
        return tripIDs;
    }
}

module.exports = TripsLocator;
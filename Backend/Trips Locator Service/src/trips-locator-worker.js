const process = require("process");
const Database = require("on-transit").Database;
const PathLocationsTree = require("on-transit").PathLocationTree;
const Config = require("./res/config");

class TripsLocatorWorker{
    /**
     * Initializes the TripsLocator and the N processes
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
        	previousStopSchedule: prevStopSchedule,
        	nextStopSchedule: nextStopSchedule
        };
    }

    /**
     * Return a set of trip IDs with their trip details from a location at a certain time
     * from a list of possible stop schedules and schedule ID.
     * 
     * Pre-condition:
     *  - stopSchedules must follow the schema in the database
     *  - scheduleID must exist in the database.
     * 
     * @param {Location} location The current location
     * @param {int} time Time ellapsed from midnight
     * @param {Object} stopSchedules Stop schedules
     * @param {string} scheduleID The schedule ID
     * @return {Object} A map of trip IDs to their trip details.
     */
    async getTripIDs(location, time, stopSchedules, scheduleID){
        // Get two stop schedules which is immediately before and after the current time.
        var neighbouringStopSchedules = await this._getNeighbouringStopSchedules(stopSchedules, time);
        var prevStopSchedule = neighbouringStopSchedules.previousStopSchedule;
        var nextStopSchedule = neighbouringStopSchedules.nextStopSchedule;

        var prevPathLocationSequence = prevStopSchedule.pathLocationIndex;
        var nextPathLocationSequence = nextStopSchedule.pathLocationIndex;

        // Find the trips associated with this schedule
        var tripIDs = {};
        var tripsCursor = this.database.getObjects("trips", {"_id": scheduleID});

        while (await tripsCursor.hasNext()){
            var trip = await tripsCursor.next();
            var tripID = trip._id;
            var pathID = trip.pathID;
            var shortName = trip.shortname;
            var longName = trip.longname;
            var headsign = trip.headsign;

            var path = await this.database.getObject("path-trees", { "_id": pathID });
            var pathTree = new PathLocationsTree(path.tree);
            var closestPathLocation = pathTree.getNearestLocation(location);

            if (prevPathLocationSequence <= closestPathLocation.sequence){
                if (closestPathLocation.sequence <= nextPathLocationSequence){
                    var tripDetails = {
                        shortName: shortName,
                        longName: longName,
                        headsign: headsign,
                        startTime: stopSchedules[0].arrivalTime,
                        endTime: stopSchedules[stopSchedules.length - 1].departTime
                    };
                    tripIDs[tripID] = tripDetails;
                }
            }
        }
        return tripIDs;    
    }
}

/**
 * The main method for this file.
 */
(() => {
    var databaseUrl = process.argv[2];
    var databaseName = process.argv[3];
    console.log("Name: " + databaseName + "URL: " + databaseUrl);

    var curDatabase = new Database();
    curDatabase.connectToDatabase(databaseUrl, databaseName);

    process.on("message", async (message) => {

        // if (curDatabase == null){
        //     var databaseUrl = process.argv[2];
        //     var databaseName = process.argv[3];
        //     Config.IS_LOGGING && console.log("Name: " + databaseName + "URL: " + databaseUrl);

        //     curDatabase = new Database();
        //     await curDatabase.connectToDatabase(databaseUrl, databaseName);
        // }

        var jobID = message.jobID;
        var jobBatchID = message.jobBatchID;
        var location = message.location;
        var time = message.time;
        var stopSchedules = message.stopSchedules;
        var scheduleID = message.scheduleID;

        Config.IS_LOGGING && console.log("Process " + process.pid + " has recieved new job #" + jobID + " on batch #" + jobBatchID);

        var worker = new TripsLocatorWorker(curDatabase);
        var tripIDs = await worker.getTripIDs(location, time, stopSchedules, scheduleID);

        var payload = {
            jobID: jobID,
            jobBatchID: jobBatchID,
            tripIDs: tripIDs
        };

        process.send({
            pid: process.pid,
            jobExitCode: 0,
            payload: payload
        });
    });
})();


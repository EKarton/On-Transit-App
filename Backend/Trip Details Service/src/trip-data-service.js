"use strict";

const ObjectID = require('mongodb').ObjectID;
const ErrorCodes = require("./constants").ERROR_CODES;
const MongoDB_ErrorMessages = require("./constants").MONGODB_ERROR_MESSAGES;


/**
 * A class used to obtain the complete Trip details given a trip ID.
 */
class TripDataService {

    /**
     * Initializes the TripDataService
     * @param {Database} database The database to the transit data
     */
    constructor(database) {
        this.database = database;
    }

    /**
     * Returns a list of path locations in order of sequence from a path.
     * It will return a list of path locations in this object format:
     *  { 
     *      lat: <LATITUDE>, 
     *      long: <LONGITUDE> 
     *  }
     * 
     * @param {string} pathID The _id to a path in the database's path-tree collection.
     * @return {object[]} A list of path locations in an object format specified above.
     */
    getPathDetails(pathID) {
        return new Promise(async (resolve, reject) => {
            try {
                let path = await this.database.getObject("paths", { "path_id": pathID });
                let coordinates = path.location.coordinates;
                let pathLocations = coordinates.map(coord => {
                    return {
                        lat: coord[1],
                        long: coord[0]
                    };
                });

                resolve(pathLocations);
            }
            catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Returns the trip details in this format:
     * {
     *     shortName: <SHORT_NAME>,
     *     longName: <LONG_NAME>,
     *     headSign: <HEAD_SIGN>,
     *     type: <TRANSIT_TYPE>,
     *     pathID: <PATH_ID>
     * }
     * @param {String} tripID The trip ID
     */
    getTripDetails(tripID) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(tripID, typeof(tripID));
                
                let trip = await this.database.getObject("trips", { "trip_id": tripID });
                if (trip === null) {
                    reject(ErrorCodes.TRIP_NOT_FOUND);
                }

                let tripObj = {
                    shortName: trip.short_name,
                    longName: trip.long_name,
                    headSign: trip.headsign,
                    type: trip.type,
                    pathID: trip.path_id
                };
                resolve(tripObj);
            }
            catch (error) {
                if (error.message === MongoDB_ErrorMessages.OBJECT_ID_ERROR) {
                    reject(ErrorCodes.TRIP_NOT_FOUND);
                }
                reject(error);
            }
        });
    }

    /**
     * Returns the stop schedules' details in a schedule including its arrival time.
     * It will return it as an array of objects, with each object formatted as:
     * {
     *    lat: <LATITUDE>,
     *    long: <LONGITUDE>
     *    name: <NAME_OF_STOP_LOCATION>,
     *    description: <DESCRIPTION>,
     *    time: <ARRIVAL_TIME>,
     *    headsign: <HEAD_SIGN>
     * }
     * 
     * @param {string} scheduleID The _id to a schedule in the database's schedules collection.
     * @return {object[]} Returns an array of stop schedules as shown above.
     */
    getScheduleDetails(scheduleID) {
        return new Promise(async (resolve, reject) => {
            try {
                let schedule = await this.database.getObject("schedules", { "_id": new ObjectID(scheduleID) });
                if (schedule === null) {
                    reject(ErrorCodes.SCHEDULE_NOT_FOUND);
                }

                let times = schedule.times;
                let headsigns = schedule.headsigns;
                let locationIDs = schedule.locations;

                let locationPromises = locationIDs.map((locationID, index) => {
                    return new Promise(async (resolveJob, rejectJob) => {
                        let stopLocation = await this.database.getObject("stop_locations", { "stop_id": locationID });

                        let time = times[index];
                        let headsign = headsigns[index];

                        let stop = {
                            lat: stopLocation.latitude,
                            long: stopLocation.longitude,
                            description: stopLocation.description,
                            name: stopLocation.stop_name,
                            time: time,
                            headsign: headsign
                        };
                        resolveJob(stop);
                    });
                });
                let locations = await Promise.all(locationPromises);
                resolve(locations);
            }
            catch (error) {
                if (error.message === MongoDB_ErrorMessages.OBJECT_ID_ERROR) {
                    reject(ErrorCodes.SCHEDULE_NOT_FOUND);
                }
                reject(error);
            }
        });
    }

    /**
     * Returns the trip schedule details.
     * It will return it as an array of objects, with each object formatted as:
     * {
     *    id: 12131321231,
     *    shortName: "109",
     *    longName: "Meadowvale Express",
     *    headSign: <HEAD_SIGN>,
     *    type: <TRANSIT_TYPE>,
     *    stops: [
     *        { lat: <LATITUDE> , long: <LONGITUDE> , name: <NAME> , time: <TIME> },
     *        ...
     *    ],
     *    path: [
     *        { lat: <LATITUDE> , long: <LONGITUDE> },
     *        ...
     *    ]
     * }
     * 
     * @param {string} tripID The _id to a trip in the database's trips collection.
     * @return {object} Returns the trip details in an object as shown above.
     */
    getTripScheduleData(tripID, scheduleID) {
        return new Promise(async (resolve, reject) => {
            try {
                let tripPromise = this.getTripDetails(tripID);
                let schedulePromise = this.getScheduleDetails(scheduleID);
                let results = await Promise.all([tripPromise, schedulePromise]);

                let tripDetails = results[0];
                let scheduleDetails = results[1];
                let pathDetails = await this.getPathDetails(tripDetails.pathID);

                let completeTripSchedule = {
                    id: tripID,
                    shortName: tripDetails.shortName,
                    longName: tripDetails.longName,
                    headSign: tripDetails.headSign,
                    type: tripDetails.type,
                    path: pathDetails,
                    stops: scheduleDetails
                };
                resolve(completeTripSchedule);
            }
            catch (error) {
                console.error(error);
                reject(error);
            }
        });
    }
}

module.exports = TripDataService;
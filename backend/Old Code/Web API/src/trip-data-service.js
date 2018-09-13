"use strict";

const Database = require("on-transit").Database;
const PathLocationTree = require("on-transit").PathLocationTree;

/**
 * A class used to obtain the complete Trip details given a trip ID.
 */
class TripDataService{

    /**
     * Initializes the TripDataService
     * @param {Database} database The database to the transit data
     */
    constructor(database){
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
    _getPathLocations(pathID){
        return new Promise(async (resolve, reject) => {
            try{
                var path = await this.database.getObject("path-trees", { "_id": pathID });
                var pathTree = new PathLocationTree(path.tree);
                var unorderedPathLocations = pathTree.getAllLocations();

                // Sort the path locations by the sequence
                var orderedPathLocations = unorderedPathLocations.sort((a, b) => {
                    var sequenceA = a.sequence;
                    var sequenceB = b.sequence;

                    if (sequenceA < sequenceB){
                        return -1;
                    }
                    else{
                        return 1;
                    }
                });

                // Remove any other properties from the unorderedPathLocations[] except 
                // for latitude and longitude
                var filteredPathLocations = [];
                for (let i = 0; i < orderedPathLocations.length; i++){
                    var pathLocation = orderedPathLocations[i];
                    var latitude = pathLocation.latitude;
                    var longitude = pathLocation.longitude;
                    var filteredLocation = {
                        lat: latitude,
                        long: longitude
                    };

                    filteredPathLocations.push(filteredLocation);
                }                

                resolve(filteredPathLocations);
            }
            catch(error){
                reject(error);
            }
        });
    }

    /**
     * Returns a the stop locaiton from the database given the stop location's ID.
     * The object returned is in this format:
     * {
     *    lat: <LATITUDE>,
     *    long: <LONGITUDE>,
     *    name: <NAME_OF_STOP>
     * }
     * 
     * @param {string} stopLocationID The _id to a stop location in the database's stop-locations collection.
     * @return {object} Returns the details of the stop location, as mentioned above.
     */
    _getStopLocation(stopLocationID){
        return new Promise(async (resolve, reject) => {
            try{
                var rawData = await this.database
                    .getObject("stop-locations", { "_id": stopLocationID });

                var stopLocation = {
                    lat: rawData.latitude,
                    long: rawData.longitude,
                    name: rawData.name
                };
                resolve(stopLocation);
            }
            catch(error){
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
     *    time: <ARRIVAL_TIME>
     * }
     * 
     * @param {string} scheduleID The _id to a schedule in the database's schedules collection.
     * @return {object[]} Returns an array of stop schedules as shown above.
     */
    _getSchedule(scheduleID){
        return new Promise(async (resolve, reject) => {
            try{
                var schedule = await this.database.getObject("schedules", { "_id": scheduleID });
                var stopSchedules = schedule.stopSchedules;

                var stops = [];
                for (let i = 0; i < stopSchedules.length; i++) {
                    var stopSchedule = stopSchedules[i];

                    var stopLocationID = stopSchedule.stopLocationID;    
                    var arrivalTime = stopSchedule.arrivalTime;
                    
                    var stopLocation = await this._getStopLocation(stopLocationID);
                    if (stopLocation != null){
                        var stop = {
                            lat: stopLocation.lat,
                            long: stopLocation.long,
                            name: stopLocation.name,
                            time: arrivalTime
                        };

                        stops.push(stop);
                    }
                }
                resolve(stops);
            }
            catch(error){
                reject(error);
            }
        });
    }

    /**
     * Returns the trip details in a trip including its path and schedule
     * It will return it as an array of objects, with each object formatted as:
     * {
     *    id: 12131321231,
     *    shortName: "109",
     *    longName: "Meadowvale Express",
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
    getTripData(tripID){
        return new Promise(async (resolve, reject) => {
            try{        
                var trip = await this.database.getObject("trips", { "_id": tripID });

                var tripDetails = {
                    id: tripID,
                    shortName: trip.shortname,
                    longName: trip.headsign,
                    stops: await this._getSchedule(tripID),
                    path: await this._getPathLocations(trip.pathID)
                };
                resolve(tripDetails);
            }
            catch(error){
                reject(error);
            }
        });
    }
}

module.exports = TripDataService;
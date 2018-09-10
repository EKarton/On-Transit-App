"use strict";

const Database = require("on-transit").Database;
const PathLocationTree = require("on-transit").PathLocationTree;

class TripDataService{
    constructor(database){
        this.database = database;
    }

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

    getTripData(tripID){
        return new Promise(async (resolve, reject) => {
            try{        
                var trip = await this.database.getObject("trips", { "_id": tripID });

                var tripDetails = {
                    id: tripID,
                    shortName: trip.shortName,
                    longName: trip.longName,
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
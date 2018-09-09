"use strict";

const Location = require("on-transit").Location;
const Database = require("on-transit").Database;
const PathLocationsTree = require("on-transit").PathLocationTree;

class TripSchedulesAggregator{

    /**
     * 
     * @param {Database} oldDatabase 
     * @param {Database} newDatabase 
     */
    constructor(oldDatabase, newDatabase){
        this._oldDatabase = oldDatabase;
        this._newDatabase = newDatabase;
    }

    /**
     * 
     * @param {Location} location1 
     * @param {Location} location2 
     */
    _getDistanceSquared(location1, location2){
        var dLatitude = location1.latitude - location2.latitude;
        var dLongitude = location1.longitude - location2.longitude;
        return (dLatitude * dLatitude) + (dLongitude * dLongitude);
    }

    async _getClosestPathLocationIndex(stopLocation, pathID){
        var path = await this._oldDatabase.getObject("path-trees", { "_id": pathID });
        var pathTreeData = path.tree;
        var tree = new PathLocationsTree(pathTreeData);
        return tree.getNearestLocation(stopLocation);
    }

    async processSchedule(schedule){
        var tripID = schedule._id;
        var scheduleID = schedule._id;
        var stopSchedules = schedule.stopSchedules;
        var newStopSchedules = [];

        for (let i = 0; i < stopSchedules.length; i++){
            var stopSchedule = stopSchedules[i];
            var stopLocationID = stopSchedule.stopLocationID;
            var stopLocation = await this._oldDatabase
                .getObject("stop-locations", { "_id": stopLocationID });   
                
            var trip = await this._oldDatabase.getObject("trips", { "_id": tripID });
            var pathID = trip.pathID;
            var closestPathLocationIndex = await this._getClosestPathLocationIndex(stopLocation, pathID);
            

            var newStopSchedule = {
                arrivalTime: stopSchedule.arrivalTime,
                departTime: stopSchedule.departTime,
                stopLocationID: stopSchedule.stopLocationID,
                pathLocationIndex: closestPathLocationIndex
            };
            newStopSchedules.push(newStopSchedule);
        };

        // Make a copy of the db entry with the index to the new database
        var newDbObject = {
            _id: scheduleID,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            stopSchedules: newStopSchedules
        };
        return newDbObject;
    }

    processData(){
        return new Promise(async (resolve, reject) => {
            try{
                var cursor = await this._oldDatabase.getObjects("schedules", {});
                var newSchedules = [];
                var numFinished = 0;
                while (await cursor.hasNext()){
                    var schedule = await cursor.next();
                    var newSchedule = await this.processSchedule(schedule);                    
                    newSchedules.push(newSchedule);

                    numFinished ++;
                    console.log("Done " + numFinished);
                }
                await this._newDatabase.saveArrayToDatabase("schedules", newSchedules);

                resolve();
            }
            catch(error){
                reject(error);
            }
        });      
    }
}

module.exports = TripSchedulesAggregator;
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

    async _getClosestPathLocationIndex(stopLocation, pathID){
        var path = await this._oldDatabase.getObject("path-trees", { "_id": pathID });
        var pathTreeData = path.tree;
        var tree = new PathLocationsTree(pathTreeData);
        return tree.getNearestLocation(stopLocation).sequence;
    }

    async processSchedule(schedule){

        // Information stored in a schedule
        var tripID = schedule._id.trim();
        var scheduleID = schedule._id.trim();
        var stopSchedules = schedule.stopSchedules;
        var newStopSchedules = [];

        // Get the path locations tree for fast querying
        var trip = await this._oldDatabase.getObject("trips", { "_id": tripID });
        var pathID = trip.pathID.trim();
        var path = await this._oldDatabase.getObject("path-trees", { "_id": pathID });
        var pathTreeData = path.tree;
        var tree = new PathLocationsTree(pathTreeData);

        for (let i = 0; i < stopSchedules.length; i++){
            var stopSchedule = stopSchedules[i];
            var stopLocationID = stopSchedule.stopLocationID;
            var rawStopLocation = await this._oldDatabase
                .getObject("stop-locations", { "_id": stopLocationID });   

            var stopLocation = new Location(rawStopLocation.latitude, rawStopLocation.longitude);
                
            var closestPathLocation = tree.getNearestLocation(stopLocation);  

            var newStopSchedule = {
                arrivalTime: stopSchedule.arrivalTime,
                departTime: stopSchedule.departTime,
                stopLocationID: stopSchedule.stopLocationID,
                pathLocationIndex: closestPathLocation.sequence
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
                while (await cursor.hasNext()){
                    var schedule = await cursor.next();
                    var newSchedule = await this.processSchedule(schedule);                    

                    await this._newDatabase.saveObjectToDatabase("schedules", newSchedule);
                }               

                resolve();
            }
            catch(error){
                reject(error);
            }
        });      
    }
}

module.exports = TripSchedulesAggregator;
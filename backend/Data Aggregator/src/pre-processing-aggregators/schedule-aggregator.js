"use strict";

const Database = require("./common/database");

class ScheduleAggregator{
    /**
     * 
     * @param {Database} rawDatabase 
     * @param {Database} cleanDatabase 
     */
    constructor(rawDatabase, cleanDatabase){
        this._rawDatabase = rawDatabase;
        this._cleanDatabase = cleanDatabase;
    }

    /**
     * What I need:
     * 1. Given the current time and a set of GPS location give me a set of path IDs that are 
     *    within that time.
     *    How to do this?
     *    - Well, given the current time we can determine which two stops, A and B that it lies on.
     *      Results for A and B can be alot. 
     *      
     *      Let S[] be an array of tuples (A, B) s.t. 
     *      A.departTime < time < B.startTime and there exists a tripID s.t. A.tripID == B.tripID
     * 
     *      Now for all A and B in S[] we know which path locations are the closest to A and B.
     *      Let A.pathLocationID and B.pathLocationID be the closest path points to those s.t. A.pathLocationID is inside A.tripID
     *      and B.pathLocationID is inside B.tripID.
     * 
     *      So if a path location in the list of path locations in that trip ID is the closest to the GPS location AND
     *      that path location is between A and B, we can add that trip ID to the list of possible trip IDs.
     * 
     *      The algorithm:
     * 
     *      This class represents the results for searching for two stops within the current time that shares the same tripID.
     *      class StopScheduleResults{
     *          this.firstStop;
     *          this.secondStop;
     *          this.tripID;
     *      }
     * 
     *      def getSchedulesWithin(curTime):
     *          var length = schedules.length;
     *          var left = 0;
     *          var right = length - 1;
     * 
     *          while left <= right:
     *              var mid = (left + right) / 2;
     *              var schedule = schedules[mid];
     *              
     *              if (schedule.startTime < curTime && curTime < schedule.endTime){
     *                  break;
     *              }
     *              
     *          
     * 
     *      def getStopsWithin(curTime):
     *          for schedule in schedules:
     *              if schedule.startTime > curTime:
     *                  continue;
     * 
     *              if schedule.endTime < curTime:
     *                  continue;
     * 
     *              
     * 
     *              
     * 
     * 
     *      var stopScheduleResults = getStopsWithin(curTime);
     *      var tripIDs = []
     *      for stopScheduleResult in stopScheduleResults:
     *           var stopA = stopScheduleResult.firstStop();
     *           var stopB = stopScheduleResult.lastStop();
     *           var closestPathLocationToStopA_Index = getClosestPathLocation(stopA.tripID, stopA.location);
     *           var closestPathLocationToStopB_Index = getClosestPathLocation(stopB.tripID, stopB.location);
     *           var closestPathLocationIndex = getClosestPathLocation(stopA.tripID, curGPSLocation);
     * 
     *           if (closestPathLocationToStopA_Index <= closestPathLocationIndex){
     *                if (closestPathLocationIndex <= closestPathLocationToStopB_Index)
     *                    tripIDs.push(A.tripID);
     *           }
     *           
     */

    sortStopSchedulesByStopSequence(stopSchedules){
        stopSchedules.sort((a, b) => {
            var orderA = a.sequence;
            var orderB = b.sequence;

            if (orderA < orderB){
                return -1;
            }
            else{
                return 1;
            }
        });
    }

    async sortStopSchedules(){
        var cursor = await this._cleanDatabase.getObjects("schedules", {});
        while (await cursor.hasNext()){
            var rawScheduleData = await cursor.next();
            var scheduleID = rawScheduleData._id;
            var curStopSchedules = rawScheduleData.stopSchedules;
            this.sortStopSchedulesByStopSequence(curStopSchedules);

            var newValues = {
                $set: {
                    stopSchedules: curStopSchedules
                }
            };

            await this._cleanDatabase.updateObject("schedules", { "_id": scheduleID }, newValues);
        }
    }

    async combineStopSchedules(){
        var cursor = await this._rawDatabase.getObjects("raw-stop-times", {});
        while (await cursor.hasNext()){
            var rawStopTimesData = await cursor.next();
            var tripID = rawStopTimesData.tripID;
            var stopLocationID = rawStopTimesData.stopLocationID;
            var arrivalTime = rawStopTimesData.arrivalTime;
            var departTime = rawStopTimesData.departTime;
            var sequence = rawStopTimesData.sequence;
            var headsign = rawStopTimesData.headsign;

            // Define the stop schedule to be added to the list
            var stopSchedule = {
                arrivalTime: arrivalTime,
                departTime: departTime,
                sequence: sequence,
                stopLocationID: stopLocationID
            };

            // See if there is any existing data
            var existingSchedule = await this._cleanDatabase.getObject("schedules", { "_id": tripID });

            // If there is no existing data, make one
            if (existingSchedule == null){
                var newDbObject = {
                    _id: tripID,
                    startTime: arrivalTime,
                    endTime: departTime,
                    headsign: headsign,
                    stopSchedules: [stopSchedule]
                };
                await this._cleanDatabase.saveObjectToDatabase("schedules", newDbObject);
            }

            // If there is, simply add the stopLocationID to the list of stopLocations[]
            else{
                var minStartTime = Math.min(departTime, existingSchedule.startTime);
                var maxEndTime = Math.max(departTime, existingSchedule.endTime);

                var stopSchedules = existingSchedule.stopSchedules;
                stopSchedules.push(stopSchedule);

                var newValues = {
                    $set: {
                        startTime: minStartTime,
                        endTime: maxEndTime,
                        stopSchedules: stopSchedules
                    } 
                };                    
                await this._cleanDatabase.updateObject("schedules", { "_id": tripID }, newValues);
            }
        }
    }

    processData(){
        return new Promise(async (resolve, reject) => {
            try{
                //await this.combineStopSchedules();
                await this.sortStopSchedules();
                resolve();
            }
            catch(error){
                reject(error);
            }
        });
    }
}

module.exports = ScheduleAggregator;
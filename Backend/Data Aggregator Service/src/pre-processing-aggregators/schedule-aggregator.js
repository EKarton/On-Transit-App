"use strict";

const Database = require("on-transit").Database;

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
        var cursor = await this._cleanDatabase.getObjects("schedules", {}).batchSize(2000);
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

    saveStopSchedules(tripID){
        return new Promise(async (resolve, reject) => {
            try{
                //console.log("Processing ", tripID);
                var minStartTime = 1000000000000;
                var maxEndTime = -100000000000;
                var headsign = "";
                var stopSchedules = [];

                var cursor = await this._rawDatabase.getObjects("raw-stop-times", { "tripID": tripID }).batchSize(80000);
                while (await cursor.hasNext()){
                    var rawStopTimesData = await cursor.next();

                    var stopLocationID = rawStopTimesData.stopLocationID;
                    var arrivalTime = rawStopTimesData.arrivalTime;
                    var departTime = rawStopTimesData.departTime;
                    var sequence = rawStopTimesData.sequence;
                    headsign = rawStopTimesData.headsign;

                    minStartTime = Math.min(arrivalTime, departTime, minStartTime);
                    maxEndTime = Math.max(arrivalTime, departTime, maxEndTime);

                    // Define the stop schedule to be added to the list
                    var stopSchedule = {
                        arrivalTime: arrivalTime,
                        departTime: departTime,
                        sequence: sequence,
                        stopLocationID: stopLocationID
                    };
                    stopSchedules.push(stopSchedule);
                }
                //console.log("Saving Processed Data ", tripID);

                // Save the stop schedules into the database
                var newDbObject = {
                    _id: tripID,
                    startTime: minStartTime,
                    endTime: maxEndTime,
                    headsign: headsign,
                    stopSchedules: stopSchedules
                };
                await this._cleanDatabase.saveObjectToDatabase("schedules", newDbObject);
                //console.log("Finished Processing ", tripID);
                resolve();
            }
            catch(error){
                reject(error);
            }
        });
    }

    async combineStopSchedules(){
        var cursor = await this._rawDatabase.getObjects("raw-trips", {}).batchSize(80000);
        while (await cursor.hasNext()){
            var rawTripObj = await cursor.next();
            var tripID = rawTripObj._id;

            await this.saveStopSchedules(tripID);
        }
    }

    processData(){
        return new Promise(async (resolve, reject) => {
            try{
                await this.combineStopSchedules();
                await this.sortStopSchedules();
                console.log("Finished aggregating stop schedules");
                resolve();
            }
            catch(error){
                reject(error);
            }
        });
    }
}

module.exports = ScheduleAggregator;
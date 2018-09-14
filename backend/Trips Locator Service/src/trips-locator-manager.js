"use strict";

const Processes = require("child_process");
const OS = require("os");
const Database = require("on-transit").Database;
const Location = require("on-transit").Location;

/**
 * A class used to locate the trip IDs based on a user's 
 * GPS location and time.
 */
class TripsLocatorManager{

    /**
     * Initializes the TripsLocator and the N processes
     * @param {Database} database A database used to obtain transit data
     */
    constructor(database){
        this.database = database;
        this.workers = {};

        this.numWorkers = OS.cpus().length;
        for (let i = 0; i < this.numWorkers; i++){
            this.createWorker();
        }
    }

    createWorker(){
        var databaseUrl = this.database.databaseUrl;
        var databaseName = this.database.databaseName;

        var newWorker = Processes.fork("src/trips-locator-worker.js", [databaseUrl, databaseName]);
        var newWorkerPID = newWorker.pid;
        console.log("Created new worker: " + newWorkerPID);
        this.workers[newWorkerPID] = newWorker;
    }

    async getJobs(location, time){
        var jobs = [];
        var cursor = this.database.getObjects("schedules", {
            startTime: { $lte: time },
            endTime: { $gte: time }
        }).batchSize(2000);

        var jobIndex = 0;
        while (await cursor.hasNext()){
            var schedule = await cursor.next();
            var stopSchedules = schedule.stopSchedules;
            var scheduleID = schedule._id;    
            
            var newJob = {
                jobID: jobIndex,
                location: location,
                time: time,
                stopSchedules,
                scheduleID: scheduleID
            };
            jobs.push(newJob);

            jobIndex ++;
        }
        return jobs;
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
                var validTripIDs = [];
                var unfinishedJobs = await this.getJobs(location, time);
                console.log("Got jobs");
                
                var numInitJobs = Math.min(unfinishedJobs.length, this.numWorkers);
                Object.keys(this.workers).forEach(pid => {
                    if (numInitJobs > 0){
                        var curJob = unfinishedJobs.pop();

                        this.workers[pid].send(curJob);
                        numInitJobs --;
                    }
                });

                var areValidTripIDsSent = false;

                // Set up the listener
                Object.keys(this.workers).forEach(pid => {
                    var worker = this.workers[pid];
                    worker.on("message", (message) => {
                        var workerPID = message.pid;
                        var status = message.jobExitCode;

                        if (status == 0){
                            // Save the results
                            var tripIDs = message.tripIDs;
                            validTripIDs = validTripIDs.concat(tripIDs);
    
                            // Put more jobs to this worker
                            if (unfinishedJobs.length > 0){
                                var newJob = unfinishedJobs.pop();
                                this.workers[workerPID].send(newJob);
                            }
                            else{
                                // This is needed so that not all N workers call the resolve()
                                // ** it is only called once
                                if (!areValidTripIDsSent){
                                    console.log("FINISHED!!");
                                    areValidTripIDsSent = true;
                                    resolve(validTripIDs);
                                }
                            }
                        }
                    });
                });
            }
            catch(error){
                console.log(error);
                reject(error);
            }
        });
        
    }
}

module.exports = TripsLocatorManager;
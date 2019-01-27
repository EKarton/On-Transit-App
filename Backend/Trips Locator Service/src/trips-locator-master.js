"use strict";

const Processes = require("child_process");
const OS = require("os");
const Database = require("on-transit").Database;
const Location = require("on-transit").Location;
const Job = require("./job");
const JobsBatch = require("./jobs-batch");
const Config = require("./res/config");

class TripsLocatorMaster{

    /**
     * Initializes the Trips Locator with the database
     * @param {Database} database A database
     */
    constructor(database){
        this.database = database;

        this.workers = {};
        this.idleWorkersPid = [];
        this.numWorkers = OS.cpus().length;

        this.readyJobIDs = [];

        // The key is the job batch ID / job ID and the value 
        // is the job batch object / job object
        this.jobsBatchIDToInstance = {};
        this.jobIDToInstance = {};

        for (let i = 0; i < this.numWorkers; i++){
            this.createWorker();
        }
    }

    /**
     * Creates a worker and adds its PID to this.idleWorkersPid[]
     */
    createWorker(){
        var databaseUrl = this.database.databaseUrl;
        var databaseName = this.database.databaseName;
        var newWorker = Processes.fork(
            "trips-locator-worker.js", 
            [databaseUrl, databaseName]
        );

        var newWorkerPID = newWorker.pid;
        this.workers[newWorkerPID] = newWorker;
        this.idleWorkersPid.push(newWorkerPID);

        Config.IS_LOGGING && console.log("Created new worker: " + newWorkerPID);

        // An event when the worker is messaging back to the parent
        newWorker.on("message", (message) => {
            this.onHandleJobCompletion(message);
        });
    }

    /**
     * Handles an event when a worker sends a message.
     * The message object needs to be in this format:
     * {
     *    pid: <WORKER_PID>,
     *    jobExitCode: <EXIT_CODE>
     *    payload: <PAYLOAD_OBJ>
     * }
     * 
     * Note that if jobExitCode is 0, <PAYLOAD_OBJ> needs to be in the 
     * following format:
     * {
     *    jobID: <JOB_ID>,
     *    jobBatchID: <JOB_BATCH_ID>,
     *    tripIDs: <LIST_OF_TRIP_IDS_FROM_DATABASE>
     * }
     * 
     * @param {Object} message The message object as described above
     */
    onHandleJobCompletion(message){
        var workerPID = message.pid;
        var worker = this.workers[workerPID];
        var status = message.jobExitCode;

        var jobID = message.payload.jobID;
        var jobBatchID = message.payload.jobBatchID;
        var tripIDs = message.payload.tripIDs;

        Config.IS_LOGGING && console.log("Master: Process " + workerPID + " has finished with: " + JSON.stringify(message));

        // Handle the result if successful
        if (status == 0){
            // Delete the job object
            //delete this.jobIDToInstance[jobID];

            // Save the results
            var jobBatch = this.jobsBatchIDToInstance[jobBatchID];
            jobBatch.tripIDs = {
                ...jobBatch.tripIDs,
                ...tripIDs
            };
            jobBatch.numJobsCompleted = jobBatch.numJobsCompleted + 1;

            Config.IS_LOGGING && console.log("Master: Num jobs vs num jobs completed: " + jobBatch.numJobs + " " + jobBatch.numJobsCompleted);

            // Alert the caller once the jobs are all completed in the job batch
            if (jobsBatch.isReady && jobBatch.numJobs == jobBatch.numJobsCompleted){
                Config.IS_LOGGING && console.log("Master: Job Batch " + jobBatchID + " has been completed!");
                this.finishJobsBatch(jobBatch.jobBatchID);
            }
        }
    }

    /**
     * Adds a new job to the jobs queue
     * @param {Job} job A new job 
     */
    addJob(job){
        this.jobIDToInstance[job.jobID] = job;

        var idlingWorkerPid = this.idleWorkersPid.pop();
        var idlingWorker = this.workers[idlingWorkerPid];

        Config.IS_LOGGING && console.log("Adding new job to idling worker " + idlingWorkerPid + ": " + job.jobID);
        idlingWorker.send(job);
        this.idleWorkersPid.unshift(idlingWorkerPid);
    }

    /**
     * Adds a new jobs batch to the list
     * @param {JobsBatch} jobsBatch A new jobs batch
     */
    addJobsBatch(jobsBatch){
        var batchID = jobsBatch.jobBatchID;
        this.jobsBatchIDToInstance[batchID] = jobsBatch;
    }

    finishJobsBatch(jobBatchID){
        let jobsBatch = this.jobsBatchIDToInstance[jobBatchID];
        jobsBatch.resolve(jobsBatch.tripIDs);
        delete this.jobsBatchIDToInstance[jobBatchID];
    }

    /**
     * Handles a new request by calculating and running its jobs.
     * @param {Location} location The current location
     * @param {int} time The time ellapsed from midnight
     * @param {Function} resolve A function used to return back to the client.
     * @param {Function} reject A function that is used to return back to the client
     */
    async handleNewRequest(location, time, resolve, reject){

        // Create a new jobs batch
        var jobsBatch = new JobsBatch(0, resolve, reject);
        jobsBatch.isReady = false;
        this.addJobsBatch(jobsBatch);

        // Get and add the jobs to the job queue
        Config.IS_LOGGING && console.log("Getting schedules");
        var cursor = this.database.getObjects("schedules", {
            startTime: { $lte: time },
            endTime: { $gte: time }
        });
        Config.IS_LOGGING && console.log("Finished getting schedules!");

        if (!cursor.hasNext()){
            this.finishJobsBatch(jobsBatch.jobBatchID);
        }

        cursor.forEach((schedule) => {
            Config.IS_LOGGING && console.log("Finished getting schedule");
            var stopSchedules = schedule.stopSchedules;
            var scheduleID = schedule._id;    

            var newJob = new Job(jobsBatch.jobBatchID, location, time, stopSchedules, scheduleID);
            jobsBatch.numJobs ++;
            this.addJob(newJob);
        }, (error) => {
            jobsBatch.isReady = true;

            if (jobsBatch.numJobs == jobsBatch.numJobsCompleted){
                Config.IS_LOGGING && console.log("Master: Job Batch " + jobsBatch.jobBatchID + " has been completed!");
                this.finishJobsBatch(jobsBatch.jobBatchID);
            }
        });
    }

    /**
     * Returns a list of trip IDs that are close to a certain location at a certain time.
     * @param {Location} location The current location
     * @param {int} time The time ellapsed from midnight
     * @return {Promise} A promise. 
     *  When successful, it will pass the found trip IDs to the .resolve(); 
     *  else it will pass the error to .reject().
     */
    getTripIDsNearLocation(location, time){
        var jobBatchPromise = new Promise(async (resolve, reject) => {
            try{
                this.handleNewRequest(location, time, resolve, reject);
            }
            catch(error){
                Config.IS_LOGGING && console.log(error);
                reject(error);
            }
        });
        return jobBatchPromise;
    }
}

module.exports = TripsLocatorMaster;
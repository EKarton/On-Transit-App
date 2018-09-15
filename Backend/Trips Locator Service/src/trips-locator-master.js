"use strict";

const Processes = require("child_process");
const OS = require("os");
const Database = require("on-transit").Database;
const Location = require("on-transit").Location;
const Job = require("./job");
const JobsBatch = require("./jobs-batch");

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
            "src/trips-locator-worker.js", 
            [databaseUrl, databaseName]
        );

        var newWorkerPID = newWorker.pid;
        this.workers[newWorkerPID] = newWorker;
        this.idleWorkersPid.push(newWorkerPID);

        console.log("Created new worker: " + newWorkerPID);

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

        console.log("Master: Process " + workerPID + " has finished with: " + JSON.stringify(message));

        // Handle the result if successful
        if (status == 0){
            // Delete the job object
            delete this.jobIDToInstance[jobID];

            // Save the results
            var jobBatch = this.jobsBatchIDToInstance[jobBatchID];
            jobBatch.tripIDs = jobBatch.tripIDs.concat(tripIDs);
            jobBatch.numJobsCompleted = jobBatch.numJobsCompleted + 1;

            console.log("Master: Num jobs vs num jobs completed: " + jobBatch.numJobs + " " + jobBatch.numJobsCompleted);

            // Alert the caller once the jobs are all completed in the job batch
            if (jobBatch.numJobs == jobBatch.numJobsCompleted){
                console.log("Master: Job Batch " + jobBatchID + " has been completed!");
                jobBatch.resolve(jobBatch.tripIDs);
            }
        }
        // Put the job back into the job queue
        else{
            console.log("Master: Process " + workerPID + " has failed to finish job " + jobID);
            this.readyJobIDs.push(jobID);
        }

        // Grab the next job (if there exists one)
        if (this.readyJobIDs.length > 0){
            var nextJobID = this.readyJobIDs.pop();
            var nextJobObject = this.jobIDToInstance[nextJobID];   

            console.log("Master: Sending process " + workerPID + " new job: " + nextJobID);
            worker.send(nextJobObject);
        }
        else{
            this.idleWorkersPid.push(worker);
        }
    }

    /**
     * Adds a new job to the jobs queue
     * @param {Job} job A new job 
     */
    addJob(job){
        this.jobIDToInstance[job.jobID] = job;

        if (this.idleWorkersPid.length > 0){
            var idlingWorkerPid = this.idleWorkersPid.pop();
            var idlingWorker = this.workers[idlingWorkerPid];

            console.log("Adding new job to idling worker " + idlingWorkerPid + ": " + job.jobID);
            idlingWorker.send(job);
        }
        else{
            console.log("Adding new job " + job.jobID + " to job queue");
            this.readyJobIDs.push(job.jobID);
        }
    }

    /**
     * Adds a new jobs batch to the list
     * @param {JobsBatch} jobsBatch A new jobs batch
     */
    addJobsBatch(jobsBatch){
        var batchID = jobsBatch.jobBatchID;
        this.jobsBatchIDToInstance[batchID] = jobsBatch;
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
        this.addJobsBatch(jobsBatch);

        // Get and add the jobs to the job queue
        var cursor = this.database.getObjects("schedules", {
            startTime: { $lte: time },
            endTime: { $gte: time }
        }).batchSize(2000);

        var jobs = [];
        while (await cursor.hasNext()){
            var schedule = await cursor.next();
            var stopSchedules = schedule.stopSchedules;
            var scheduleID = schedule._id;    

            var newJob = new Job(jobsBatch.jobBatchID, location, time, stopSchedules, scheduleID);
            jobs.push(newJob);
        }
        jobsBatch.numJobs = jobs.length;        

        // Add the jobs to be processed.
        jobs.forEach(job => {
            this.addJob(job);
        });
        
        // If there were no jobs, call back to the client
        if (jobsBatch.numJobs == 0){
            jobsBatch.resolve([]);
        }
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
                console.log(error);
                reject(error);
            }
        });
        return jobBatchPromise;
    }
}

module.exports = TripsLocatorMaster;
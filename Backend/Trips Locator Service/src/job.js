"use strict";

var numJobsMade = 0;
class Job{
    constructor(jobBatchID, location, time, stopSchedules, scheduleID){
        this.jobID = numJobsMade;
        this.jobBatchID = jobBatchID;
        this.location = location;
        this.time = time;
        this.stopSchedules = stopSchedules;
        this.scheduleID = scheduleID;

        numJobsMade ++;
    }
}

module.exports = Job;
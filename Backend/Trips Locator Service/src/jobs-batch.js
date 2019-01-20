"use static";

var numJobBatchesMade = 0;

class JobsBatch{
    constructor(numJobs, onJobBatchCompletion, onJobBatchError){
        this.jobBatchID = numJobBatchesMade;

        this.numJobs = numJobs;
        this.numJobsCompleted = 0;

        this.tripIDs = {};

        this.resolve = onJobBatchCompletion;
        this.reject = onJobBatchError;

        numJobBatchesMade ++;
    }
}

module.exports = JobsBatch;
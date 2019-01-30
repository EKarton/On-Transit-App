const Location = require("on-transit").Location;
const Kue = require("kue");
const Config = require("./res/config");

var queue = null;

function closeQueueConnection(){
    return new Promise((resolve, reject) => {
        if (queue){
            queue.shutdown(() => {
                console.log("Queue closed connecton to Redis");
                resolve();
            });
        } 
        else{
            resolve();
        }
    });
}

function onJobSaveFailedHandler(error){
    if (error) {
        console.log('INDEX JOB SAVE FAILED');
        return;
    }
}

module.exports = {

    /**
     * Makes a connection to the Redis instance, as well as
     * other miscillaneous jobs to ensure successful shutdown and launch
     * of the app.
     */
    run(){
        const redisOptions = {
            host: Config.REDIS_HOST,
            port: Config.REDIS_PORT,
            auth: Config.REDIS_AUTH
        };
        queue = Kue.createQueue(redisOptions);

        process.on("SIGINT", async () => {
            await closeQueueConnection();
            process.exit(-1);
        });
        
        process.on("exit", async () => {
            await closeQueueConnection();
        });
    },

    /**
     * Returns a list of trip IDs that are close to a certain location at a certain time.
     * @param {Location} location The current location
     * @param {int} time The time ellapsed from midnight
     * @param {int} radius The radius around the current location
     * @return {Promise} A promise. 
     *  When successful, it will pass the found trip IDs to the .resolve(); 
     *  else it will pass the error to .reject().
     */
    getTripIDsNearLocation(location, time, radius){
        return new Promise(async (resolve, reject) => {

            let jobPayload = {
                location: location,
                time: time,
                radius: radius
            };

            let job = queue.create("download", jobPayload)
                .removeOnComplete(true)
                .save(onJobSaveFailedHandler);

            job.on("complete", (responseObj) => {
                resolve(responseObj);
            });    
            
            job.on("failed", error => {
                console.log('INDEX JOB FAILED');
                console.log(error);
            });
        });
    }
};
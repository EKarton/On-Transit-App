const kue = require("kue");
const config = require("./res/config");
const Database = require("on-transit").Database;

const redisOptions = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    auth: config.REDIS_AUTH
};

var queue = undefined;
var database = undefined;

function getRecentStopsVisitedByTime(times, curTime){
    let possibleStop = -1;
    for (let i = 0; i < times.length - 1; i++){
        let stopA = times[i];
        let stopB = times[i + 1];

        if (stopA[1] <= curTime && curTime <= stopB[0]){
            possibleStop = i;
            break;
        } 
    }
    return possibleStop;
}

function getRecentStopsVisitedByLocation(locationIDs, location){
    return new Promise(async (resolve, reject) => {

        let jobs = [];
        for (let i = 0; i < locationIDs.length - 1; i++){
            let newJob = new Promise(async (resolveJob, rejectJob) => {
                let locationID_1 = locationIDs[i];
                let locationID_2 = locationIDs[i + 1];
                
                let request1 = database.getObject("stop-locations", { "_id": locationID_1 });
                let request2 = database.getObject("stop-locations", { "_id": locationID_2 });
                let locations = await Promise.all([request1, request2]);

                let location_1 = locations[0];
                let location_2 = locations[1];

                let dx = location_1.longitude - location_2.longitude;
                let dy = location_1.latitude - location_2.latitude;
                let lengthOfLineSquared = (dx * dx + dy * dy);
                let innerProduct = (location.longitude - location_2.longitude) * dx + 
                                   (location.latitude - location_2.latitude) * dy;
                
                let isProjectionInLine = 0 <= innerProduct && innerProduct <= lengthOfLineSquared;

                if (isProjectionInLine){
                    resolveJob(i);
                }
                else{
                    resolveJob(null);
                }
            });
            jobs.push(newJob);
        }
        let possibleStops = await Promise.all(jobs);
        possibleStops = possibleStops.filter(a => a !== null);
        let possibleStopsSet = new Set(possibleStops);
        resolve(possibleStopsSet);
    });
}

function getPossibleSchedules(tripScheduleIDs, time, location){
    return new Promise(async (resolve, reject) => {

        let possibleSchedules = new Set();
        let schedulesAggregatorCursor = await database.getAggregatedObjects("schedules", [
            {
                $match: {
                    $and: [
                        { _id: { $in: tripScheduleIDs } },
                        { startTime: { $lte: time } },
                        { endTime: { $gte: time } } 
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        "headsigns": "$headsigns",
                        "locationIDs": "$locationIDs"
                    },
                    times: { $push: "$times" },
                    scheduleIDs: { $push: "$_id" }
                }
            }
        ]);
        while (await schedulesAggregatorCursor.hasNext()){
            let aggregatedSchedule = await schedulesAggregatorCursor.next();

            let times = aggregatedSchedule.times;
            let locationIDs = aggregatedSchedule._id.locationIDs;
            let scheduleIDs = aggregatedSchedule.scheduleIDs;

            let stopRangesByLocation = await getRecentStopsVisitedByLocation(locationIDs, location);

            for (let i = 0; i < times.length; i++){
                let tripSchedule = times[i];
                let tripScheduleID = scheduleIDs[i];
                let recentStopVisitedByTime = getRecentStopsVisitedByTime(tripSchedule, time);

                if (recentStopVisitedByTime >= 0){
                    if (stopRangesByLocation.has(recentStopVisitedByTime)){
                        possibleSchedules.add(tripScheduleID);
                    }
                    else if (stopRangesByLocation.has(recentStopVisitedByTime - 1)){
                        possibleSchedules.add(tripScheduleID);
                    }
                    else if (stopRangesByLocation.has(recentStopVisitedByTime + 1)){
                        possibleSchedules.add(tripScheduleID);
                    }
                }
            }
        }

        resolve(possibleSchedules);
    });
}

function getTripIDsNearLocation(location, time, radius){
    return new Promise(async (resolve, reject) => {
        let latitude = location.latitude;
        let longitude = location.longitude;

        let responseObj = {};

        let nearbyPathsCursor = await database.getInstance().collection("paths").find({ 
            location: { 
                $nearSphere: { 
                    $geometry: { 
                        type: "Point", 
                        coordinates: [ longitude, latitude ] 
                    }, 
                    $maxDistance: radius 
                } 
            } 
        }, {
            location: 0
        });

        while (await nearbyPathsCursor.hasNext()){
            let nearbyPath = await nearbyPathsCursor.next();
            let pathID = nearbyPath._id;

            let tripsCursor = await database.getObjects("trips", {
                "pathID": pathID
            });
            while (await tripsCursor.hasNext()){
                let trip = await tripsCursor.next();

                let schedules = trip.schedules;
                let possibleScheduleIDs = await getPossibleSchedules(schedules, time, location);

                if (possibleScheduleIDs.size > 0){

                    responseObj[trip._id] = {
                        shortname: trip.shortName,
                        longname: trip.longName,
                        headsign: trip.headSign,
                        type: trip.type,
                        schedules: Array.from(possibleScheduleIDs)
                    }
                }
            }
        }
        resolve(responseObj);
    });
}

module.exports = {
    run(){
        queue = kue.createQueue(redisOptions);

        database = new Database();
        database.connectToDatabase(config.DATABASE_URI, config.DATABASE_NAME);

        queue.process("download", function(job, done){
            let location = job.data.location;
            let time = job.data.time;
        
            console.log("GOT NEW JOB!");
        
            getTripIDsNearLocation(location, time, 50)
                .then(responseObj => {
                    console.log("FINISHED NEW JOB!");
                    done(null, responseObj);
                })
                .catch(error => {
                    console.error(error);
                    done(JSON.stringify(error));
                });
        });
        
        process.on("SIGINT", async () => {
            if (database){
                await database.closeDatabase();
            }
            process.exit(-1);
        });
        
        process.on("exit", async () => {
            if (database){
                await database.closeDatabase();
            }
        });
    }
}
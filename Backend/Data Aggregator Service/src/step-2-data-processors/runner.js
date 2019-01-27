const Database = require("on-transit").Database;
const Config = require("../res/config");
const TripToScheduleDependencyResolver = require("./trip-to-schedule-dependencies-resolver");
const TripToPathDependencyResolver = require("./trip-to-path-dependencies-resolver");
const ScheduleToStopLocationDependencyResolver = require("./schedule-to-stop-location-dependencies-resolver");

var db1 = null;
var db2 = null;
var db3 = null;

var closeConnections = async () => {
    await db1.closeDatabase();
    await db2.closeDatabase();
    await db3.closeDatabase();
};

module.exports = function(){
    return new Promise(async (resolve, reject) => {
        try{
            db1 = new Database();
            db2 = new Database();
            db3 = new Database();
            await db1.connectToDatabase(Config.MONGODB_URL, Config.PROCESSED_STEP_1_DATABASE_NAME);
            await db2.connectToDatabase(Config.MONGODB_URL, Config.PROCESSED_STEP_1_DATABASE_NAME);
            await db3.connectToDatabase(Config.MONGODB_URL, Config.PROCESSED_STEP_1_DATABASE_NAME);

            let resolver1 = new TripToScheduleDependencyResolver(db1);
            let resolver2 = new TripToPathDependencyResolver(db2);
            let resolver3 = new ScheduleToStopLocationDependencyResolver(db3);

            await resolver1.processData();
            console.log("Finished mapping trips to schedules");

            await resolver2.processData();
            console.log("Finished updating path IDs of trips");

            await resolver3.processData();
            console.log("Finished updating stop location IDs in schedules");

            await closeConnections();
            resolve();
        }
        catch(error){
            await closeConnections();
            reject(error);
        }
    });
};

// Shutdown the app when the user types CTRL-C
process.on('SIGINT', async function() {
    await closeConnections();
    process.exit(-1);
});

process.on("exit", async function(){
    await closeConnections();
});

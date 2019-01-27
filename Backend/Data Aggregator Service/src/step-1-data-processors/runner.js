const Database = require("on-transit").Database;
const RouteTripsCombiner = require("./route-trips-combiner");
const PathBuilder = require("./path-builder");
const TripScheduleBuilder = require("./trip-schedule-builder");
const StopLocationsCopier = require("./stop-locations-copier");
const Config = require("../res/config");

var oldDbs = [];
var newDbs = [];
var numDbs = 4;

var closeDatabaseConnections = async () => {
    for (let i = 0; i < numDbs; i++){
        await oldDbs[i].closeDatabase();
        await newDbs[i].closeDatabase();
    }
};

module.exports = function(){
    return new Promise(async (resolve, reject) => {

        try{
            for (let i = 0; i < numDbs; i++){
                let oldDb = new Database();
                await oldDb.connectToDatabase(Config.MONGODB_URL, Config.RAW_DATABASE_NAME);
                oldDbs.push(oldDb);
            }

            for (let i = 0; i < numDbs; i++){
                let newDb = new Database();
                await newDb.connectToDatabase(Config.MONGODB_URL, Config.PROCESSED_STEP_1_DATABASE_NAME);
                newDbs.push(newDb);
            }

            // Create the indexes
            await oldDbs[0].getInstance().collection("raw-shapes").createIndex({ shapeID: 1, sequence: 1 });
            await oldDbs[0].getInstance().collection("raw-routes").createIndex({ routeID: 1 });
            await oldDbs[0].getInstance().collection("raw-stop-times").createIndex({ tripID: 1 });

            // Create the new collections
            await newDbs[0].createCollectionInDatabase("trips");
            await newDbs[0].createCollectionInDatabase("paths");
            await newDbs[0].createCollectionInDatabase("schedules");
            await newDbs[0].createCollectionInDatabase("stop-locations");

            // Create indexes in the new collections
            await newDbs[0].getInstance().collection("trips").createIndex({ tripID: 1 });
            await newDbs[0].getInstance().collection("paths").createIndex({ pathID: 1 });
            await newDbs[0].getInstance().collection("schedules").createIndex({ tripID: 1 });
            await newDbs[0].getInstance().collection("stop-locations").createIndex({ stopLocationID: 1 });

            let rawTripsCombiner = new RouteTripsCombiner(oldDbs[0], newDbs[0]);
            let pathBuilder = new PathBuilder(oldDbs[1], newDbs[1]);
            let tripScheduleBuilder = new TripScheduleBuilder(oldDbs[2], newDbs[2]);
            let stopLocationsCopier = new StopLocationsCopier(oldDbs[3], newDbs[3]);

            let parallelJobs = [];
            parallelJobs.push(rawTripsCombiner.processData());
            parallelJobs.push(pathBuilder.processData());
            parallelJobs.push(tripScheduleBuilder.processData());
            parallelJobs.push(stopLocationsCopier.processData());

            Promise.all(parallelJobs).then(() => {
                closeDatabaseConnections();
                resolve();
            }).catch(errors => {
                console.log(errors);
                closeDatabaseConnections();
                reject(errors);
            });
        }
        catch(error){
            closeDatabaseConnections();
            console.error(error);
            reject(error);
        }
    });
};


// Shutdown the app when the user types CTRL-C
process.on('SIGINT', async function() {
    await closeDatabaseConnections();
    process.exit(-1);
});

process.on("exit", async function(){
    await closeDatabaseConnections();
});

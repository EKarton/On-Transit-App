const Database = require("on-transit").Database;
const Config = require("../res/config");
const DuplicateSchedulesRemover = require("./find-duplicate-schedules");
const DuplicatedTripsRemover = require("./find-duplicate-trips");
const DuplicatedPathsRemover = require("./find-duplicate-paths");
const DuplicateStopLocationsRemover = require("./find-duplicate-stop-locations");

var oldDbs = [];
var newDbs = [];

var closeDatabaseConnections = async () => {
    for (let i = 0; i < 4; i++){
        await oldDbs[i].closeDatabase();
        await newDbs[i].closeDatabase();
    }
};

module.exports = function(){
    return new Promise(async (resolve, reject) => {
        try{
            for (let i = 0; i < 4; i++){
                let oldDb = new Database();
                await oldDb.connectToDatabase(Config.MONGODB_URL, Config.PROCESSED_STEP_1_DATABASE_NAME);
                oldDbs.push(oldDb);
            }

            for (let i = 0; i < 4; i++){
                let newDb = new Database();
                await newDb.connectToDatabase(Config.MONGODB_URL, Config.PROCESSED_STEP_2_DATABASE_NAME);
                newDbs.push(newDb);
            }

            // Create the mapping collections and create indexes
            await oldDbs[0].createCollectionInDatabase("duplicate-to-unique-stop-location-ID");
            await oldDbs[0].createCollectionInDatabase("duplicate-to-unique-path-ID");
            await oldDbs[0].getInstance().collection("duplicate-to-unique-stop-location-ID").createIndex({ oldID: 1 });
            await oldDbs[0].getInstance().collection("duplicate-to-unique-path-ID").createIndex({ oldID: 1 });

            // Create the new collections and create indexes
            await newDbs[0].createCollectionInDatabase("trips");
            await newDbs[0].createCollectionInDatabase("stop-locations");
            await newDbs[0].createCollectionInDatabase("paths");
            await newDbs[0].createCollectionInDatabase("schedules");
            await newDbs[0].getInstance().collection("trips").createIndex({ hash: 1 });
            await newDbs[0].getInstance().collection("stop-locations").createIndex({ hash: 1 });
            await newDbs[0].getInstance().collection("paths").createIndex({ hash: 1 });
            await newDbs[0].getInstance().collection("schedules").createIndex({ hash: 1 });

            let resolver1 = new DuplicateStopLocationsRemover(oldDbs[0], newDbs[0], oldDbs[0]);
            let resolver2 = new DuplicatedPathsRemover(oldDbs[1], newDbs[1], oldDbs[1]);
            await Promise.all([resolver1.processData(), resolver2.processData()]);
            console.log("Completed stage 1");

            let resolver3 = new DuplicatedTripsRemover(oldDbs[3], newDbs[3], oldDbs[3]);
            await resolver3.processData();
            console.log("Completed stage 2");

            let resolver4 = new DuplicateSchedulesRemover(oldDbs[2], newDbs[2]);
            await resolver4.processData();
            console.log("Completed stage 3");

            await closeDatabaseConnections();
            resolve();
        }
        catch(error){
            await closeDatabaseConnections();
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

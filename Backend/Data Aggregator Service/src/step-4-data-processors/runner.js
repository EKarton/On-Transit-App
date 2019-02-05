const Database = require("on-transit").Database;
const Config = require("../res/config");
const PathsMigrator = require("./paths-migrator");
const StopLocationsMigrator = require("./stop-locations-migrator");
const SchedulesMigrator = require("./schedules-migrator");
const TripsMigrator = require("./trips-migrator");

var oldDbs = [];
var newDbs = [];
var mappingsDb = null;
var numDbs = 4;

var closeConnections = async () => {
    for (let i = 0; i < numDbs; i++){
        await oldDbs[i].closeDatabase();
        await newDbs[i].closeDatabase();
    }
    await mappingsDb.closeDatabase();
};

var setupDatabases = () => {
    for (let i = 0; i < numDbs; i++){
        oldDbs[i] = new Database();
        newDbs[i] = new Database();
    }
    mappingsDb = new Database();
};

var executeStage1 = async () => {
    console.log("Executing Stage 1");

    let stage1Jobs = [];

    // Migrate the paths
    await oldDbs[0].connectToDatabase(Config.MONGODB_URL, Config.PROCESSED_STEP_2_DATABASE_NAME);
    await newDbs[0].connectToDatabase(Config.PROD_DATABASE_URL, Config.PROD_DATABASE_NAME);
    let stage1A = new PathsMigrator(oldDbs[0], newDbs[0], mappingsDb);
    stage1Jobs.push(stage1A.processData());       

    // Migrate the stop locations
    await oldDbs[1].connectToDatabase(Config.MONGODB_URL, Config.PROCESSED_STEP_1_DATABASE_NAME);
    await newDbs[1].connectToDatabase(Config.PROD_DATABASE_URL, Config.PROD_DATABASE_NAME); 
    let stage1B = new StopLocationsMigrator(oldDbs[1], newDbs[1], mappingsDb);
    stage1Jobs.push(stage1B.processData());
    
    await Promise.all(stage1Jobs);

    console.log("Completed Stage 1");
}

var executeStage2 = async () => {
    console.log("Executing Stage 2");

    // Migrate the schedules
    await oldDbs[2].connectToDatabase(Config.MONGODB_URL, Config.PROCESSED_STEP_2_DATABASE_NAME);
    await newDbs[2].connectToDatabase(Config.PROD_DATABASE_URL, Config.PROD_DATABASE_NAME); 
    let migrator3 = new SchedulesMigrator(oldDbs[2], newDbs[2], mappingsDb);
    await migrator3.processData();

    console.log("Completed Stage 2");
};

var executeStage3 = async () => {
    console.log("Executing Stage 3");

    // Migrate the trips
    await oldDbs[3].connectToDatabase(Config.MONGODB_URL, Config.PROCESSED_STEP_3_DATABASE_NAME);
    await newDbs[3].connectToDatabase(Config.PROD_DATABASE_URL, Config.PROD_DATABASE_NAME); 
    let migrator4 = new TripsMigrator(oldDbs[3], newDbs[3], mappingsDb);
    await migrator4.processData();

    console.log("Completed Stage 3");
};



module.exports = async function(){
    try{
        setupDatabases();

        // Create a DB used to contain the mappings from old IDs to new IDs
        await mappingsDb.connectToDatabase(Config.MONGODB_URL, Config.PROCESSED_STEP_3_DATABASE_NAME);

        // Create the various collections and index them
        await mappingsDb.createCollectionInDatabase("stop-location-ID-mappings");
        await mappingsDb.createCollectionInDatabase("trip-ID-mappings");
        await mappingsDb.createCollectionInDatabase("schedule-ID-mappings");
        await mappingsDb.createCollectionInDatabase("path-ID-mappings");
        await mappingsDb.getInstance().collection("stop-location-ID-mappings").createIndex({ "oldID": 1 });
        await mappingsDb.getInstance().collection("trip-ID-mappings").createIndex({ "oldID": 1 });
        await mappingsDb.getInstance().collection("schedule-ID-mappings").createIndex({ "oldID": 1 });
        await mappingsDb.getInstance().collection("path-ID-mappings").createIndex({ "oldID": 1 });

        await executeStage1();
        await executeStage2();
        await executeStage3();

        closeConnections();
    }
    catch(error){
        closeConnections();
        console.error(error);
    }
}

// Shutdown the app when the user types CTRL-C
process.on('SIGINT', async function() {
    await closeConnections();
    process.exit(-1);
});

process.on("exit", async function(){
    await closeConnections();
});

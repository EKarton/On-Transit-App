"use strict";

const Database = require("on-transit").Database;
const RawDataCollector = require("./raw-data-collector");
const Config = require("../res/config");

let dbs = [];
let numDbs = 5;

const openConnections = async () => {
    for (let i = 0; i < numDbs; i++){
        let newDb = new Database();
        await newDb.connectToDatabase(Config.MONGODB_URL, Config.RAW_DATABASE_NAME);
        dbs.push(newDb);
    }
};

const closeConnections = async () => {
    for (let i = 0; i < numDbs; i++){
        await dbs[i].closeDatabase();
    }
};

module.exports = async function(){
    try{
        await openConnections();

        var collector = new RawDataCollector(Config.DOWNLOADS_DIRECTORY);
        await collector.clearFolder();
        await collector.downloadAndExtractGtfsData(Config.GTFS_STATIC_RESOURCE);
        
        let task1 = collector.saveTripsToDatabase(dbs[0]);
        let task2 = collector.saveRoutesToDatabase(dbs[1]);
        let task3 = collector.saveShapesToDatabase(dbs[2]);
        let task4 = collector.saveStopLocationsToDatabase(dbs[3]);
        let task5 = collector.saveStopTimesToDatabase(dbs[4]);

        let parallelTasks = [task1, task2, task3, task4, task5];

        await Promise.all(parallelTasks);

        await closeConnections();
    }
    catch(error){
        await closeConnections();
    }
};

// Shutdown the app when the user types CTRL-C
process.on('SIGINT', async function() {
    await closeConnections();
    process.exit(-1);
});

process.on("exit", async function(){
    await closeConnections();
});

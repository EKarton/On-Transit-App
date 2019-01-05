"use strict";

const Database = require("on-transit").Database;
const RawDataCollector = require("./raw-data-collector");

// Import the config file
const Config = require("../res/config");

module.exports = async function(){
    var rawDatabase = null;
    try{
        rawDatabase = new Database();
        await rawDatabase.connectToDatabase(Config.MONGODB_URL, Config.RAW_DATABASE_NAME);

        var collector = new RawDataCollector(rawDatabase, Config.DOWNLOADS_DIRECTORY);
        await collector.clearFolder();
        await collector.downloadAndExtractGtfsData(Config.GTFS_STATIC_RESOURCE);
        
        await collector.saveTripsToDatabase();
        await collector.saveRoutesToDatabase();
        await collector.saveShapesToDatabase();
        await collector.saveStopLocationsToDatabase();
        await collector.saveStopTimesToDatabase();

        await rawDatabase.closeDatabase();
    }
    catch(error){
        if (rawDatabase)
            await rawDatabase.closeDatabase();
        throw error;
    }
};
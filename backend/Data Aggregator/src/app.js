"use strict";

const Database = require("./common/database");
const RawDataCollector = require("./raw-data-collector/raw-data-collector");
const TripDetailsAggregator = require("./trip-details-aggregator");
const PathAggregator = require("./path-aggregator");
const ScheduleAggregator = require("./schedule-aggregator");
const StopLocationAggregator = require("./stop-location-aggregator");
const LocationBag = require("./location-bag");

const RAW_DATABASE_NAME = "raw-transit-data";
const PROCESSED_DATABASE_NAME = "processed-transit-data";

const MONGODB_URL = "mongodb://localhost:27017/";
const DOWNLOADS_DIRECTORY = "tmp/raw-transit-files";

async function mainParallel(){
    var rawDatabaseConnections = [];
    var processedDatabaseConnections = [];
    var aggregators = [];

    for (let i = 0; i < 5; i++){
        rawDatabaseConnections[i] = new Database();
        processedDatabaseConnections[i] = new Database();
    }

    try{
        for (let i = 0; i < 5; i++){    
            await rawDatabaseConnections[i].connectToDatabase(MONGODB_URL, RAW_DATABASE_NAME);
            await processedDatabaseConnections[i].connectToDatabase(MONGODB_URL, PROCESSED_DATABASE_NAME);
        }
                
        var locationBag = new LocationBag(processedDatabaseConnections[4], "path-locations");

        aggregators[0] = new TripDetailsAggregator(rawDatabaseConnections[0], processedDatabaseConnections[0]);
        aggregators[1] = new StopLocationAggregator(rawDatabaseConnections[1], processedDatabaseConnections[1]);
        aggregators[2] = new ScheduleAggregator(rawDatabaseConnections[2], processedDatabaseConnections[2]);
        aggregators[3] = new PathAggregator(rawDatabaseConnections[3], processedDatabaseConnections[3], locationBag);

        var waitingPromises = [];
        for (let i = 0; i < 4; i++){
            var waitingPromise = aggregators[i].processData();
            waitingPromises.push(waitingPromise);
        }

        await Promise.all(rawDatabaseConnections);
        await Promise.all(processedDatabaseConnections);
        await Promise.all(waitingPromises);

        for (let i = 0; i < 5; i++){
            if (rawDatabaseConnections[i])
                rawDatabaseConnections[i].closeDatabase();

            if (processedDatabaseConnections[i])
                processedDatabaseConnections[i].closeDatabase();
        }
    }
    catch(error){
        for (let i = 0; i < 5; i++){
            if (rawDatabaseConnections[i])
                rawDatabaseConnections[i].closeDatabase();

            if (processedDatabaseConnections[i])
                processedDatabaseConnections[i].closeDatabase();
        }

        throw error;
    }
}

async function mainSingle(){
    var rawDatabase = null;
    var processedDatabase = null;

    try{
        rawDatabase = new Database();
        await rawDatabase.connectToDatabase(MONGODB_URL, RAW_DATABASE_NAME);

        processedDatabase = new Database();
        await processedDatabase.connectToDatabase(MONGODB_URL, PROCESSED_DATABASE_NAME);

        // var tripDetailsAggregator = new TripDetailsAggregator(rawDatabase, processedDatabase);
        // await tripDetailsAggregator.aggregateTripDetails();

        //var locationBag = new LocationBag(processedDatabase, "path-locations");
        //var pathsAggregator = new PathsAggregator(rawDatabase, processedDatabase, locationBag);
        //await pathsAggregator.aggregatePaths();

        var scheduleAggregator = new ScheduleAggregator(rawDatabase, processedDatabase);
        await scheduleAggregator.processData();


        rawDatabase.closeDatabase();
        processedDatabase.closeDatabase();
    }
    catch(error){
        if (rawDatabase)
            rawDatabase.closeDatabase();

        if (processedDatabase)
            processedDatabase.closeDatabase();
        throw error;
    }

}

async function saveRawData(){
    try{
        var rawDatabase = new Database();
        await rawDatabase.connectToDatabase(MONGODB_URL, RAW_DATABASE_NAME);

        var collector = new RawDataCollector(rawDatabase, DOWNLOADS_DIRECTORY);
        await collector.clearFolder();
        await collector.downloadAndExtractGtfsData("https://www.miapp.ca/GTFS/google_transit.zip");
        
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
}

saveRawData();
mainParallel();
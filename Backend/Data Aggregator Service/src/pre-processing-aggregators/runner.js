"use strict";

// Import the classes
const Database = require("on-transit").Database;
const TripDetailsAggregator = require("./trip-details-aggregator");
const ScheduleAggregator = require("./schedule-aggregator");
const StopLocationAggregator = require("./stop-location-aggregator");
const PathsTreeBuilder = require("./paths-tree-builder");

// Import the config file
const Config = require("../res/config");

module.exports = async function(){
    var rawDatabaseConnections = [];
    var processedDatabaseConnections = [];
    var aggregators = [];

    for (let i = 0; i < 5; i++){
        rawDatabaseConnections[i] = new Database();
        processedDatabaseConnections[i] = new Database();
    }

    try{
        for (let i = 0; i < 5; i++){    
            await rawDatabaseConnections[i].connectToDatabase(Config.MONGODB_URL, Config.RAW_DATABASE_NAME);
            await processedDatabaseConnections[i].connectToDatabase(Config.MONGODB_URL, Config.PROCESSED_DATABASE_NAME);
        }

        aggregators[0] = new TripDetailsAggregator(rawDatabaseConnections[0], processedDatabaseConnections[0]);
        aggregators[1] = new StopLocationAggregator(rawDatabaseConnections[1], processedDatabaseConnections[1]);
        aggregators[2] = new ScheduleAggregator(rawDatabaseConnections[2], processedDatabaseConnections[2]);
        aggregators[3] = new PathsTreeBuilder(rawDatabaseConnections[3], processedDatabaseConnections[3]);

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
};
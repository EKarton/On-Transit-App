"use strict";

const Database = require("on-transit").Database;

const TripScheduleAggregator = require("./trip-schedules-aggregator");
const DatabaseCopier = require("./database-copier");

// Import the config file
const Config = require("../res/config");

async function _runTripScheduleAggregator(){
    var dirtyDatabase = null;
    var finalDatabase = null;

    try{
        dirtyDatabase = new Database();
        finalDatabase = new Database();

        await dirtyDatabase.connectToDatabase(Config.MONGODB_URL, Config.PROCESSED_DATABASE_NAME);
        await finalDatabase.connectToDatabase(Config.MONGODB_URL, Config.FINAL_DATABASE_NAME);

        var tripScheduleAggregator = new TripScheduleAggregator(dirtyDatabase, finalDatabase);
        await tripScheduleAggregator.processData();

        await dirtyDatabase.closeDatabase();
        await finalDatabase.closeDatabase();
    }
    catch(error){
        if (dirtyDatabase)
            await dirtyDatabase.closeDatabase();
        if (finalDatabase)
            await finalDatabase.closeDatabase();

        throw error;
    }
}

async function _copyData(){
    var collectionsToCopy = [
        "path-trees",
        "stop-locations",
        "trips"
    ];

    for(let i = 0; i < collectionsToCopy.length; i++){
        var collection = collectionsToCopy[i];
        var dirtyDatabase = null;
        var finalDatabase = null;

        try{
            dirtyDatabase = new Database();
            finalDatabase = new Database();

            await dirtyDatabase.connectToDatabase(Config.MONGODB_URL, Config.PROCESSED_DATABASE_NAME);
            await finalDatabase.connectToDatabase(Config.MONGODB_URL, Config.FINAL_DATABASE_NAME);

            var copier = new DatabaseCopier(dirtyDatabase, finalDatabase);
            await copier.copyData(collection);

            if (dirtyDatabase)
                await dirtyDatabase.closeDatabase();
            if (finalDatabase)
                await finalDatabase.closeDatabase();
        }
        catch(error){
            if (dirtyDatabase)
                await dirtyDatabase.closeDatabase();
            if (finalDatabase)
                await finalDatabase.closeDatabase();

            throw error;
        }
    }
}

module.exports = async function(){
    await _runTripScheduleAggregator();
    await _copyData();
};
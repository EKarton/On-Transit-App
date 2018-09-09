"use strict";

const Cluster = require("cluster");
const OS = require("os");

const Database = require("./common/database");
const RawDataCollector = require("./raw-data-collectors/raw-data-collector");
const TripDetailsAggregator = require("./pre-processing-aggregators/trip-details-aggregator");
const PathAggregator = require("./pre-processing-aggregators/path-aggregator");
const ScheduleAggregator = require("./pre-processing-aggregators/schedule-aggregator");
const StopLocationAggregator = require("./pre-processing-aggregators/stop-location-aggregator");
const LocationBag = require("./pre-processing-aggregators/location-bag");
const PathsTreeBuilder = require("./pre-processing-aggregators/paths-tree-builder");

const TripScheduleAggregator = require("./final-processing-aggregators/trip-schedules-aggregator");

const RAW_DATABASE_NAME = "raw-transit-data";
const PROCESSED_DATABASE_NAME = "processed-transit-data";
const FINAL_DATABASE_NAME = "clean-transit-data";

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
                
        //var locationBag = new LocationBag(processedDatabaseConnections[4], "path-locations");

        aggregators[0] = new TripDetailsAggregator(rawDatabaseConnections[0], processedDatabaseConnections[0]);
        aggregators[1] = new StopLocationAggregator(rawDatabaseConnections[1], processedDatabaseConnections[1]);
        aggregators[2] = new ScheduleAggregator(rawDatabaseConnections[2], processedDatabaseConnections[2]);
        aggregators[3] = new PathsTreeBuilder(rawDatabaseConnections[3], processedDatabaseConnections[3]);
        //aggregators[3] = new PathAggregator(rawDatabaseConnections[3], processedDatabaseConnections[3], locationBag);

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

        var pathsBuilder = new PathsTreeBuilder(rawDatabase, processedDatabase);
        await pathsBuilder.processData();


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

async function runParallel(){
    if (Cluster.isMaster){
        var dirtyDatabase = null;
        try{
            dirtyDatabase = new Database();
            await dirtyDatabase.connectToDatabase(MONGODB_URL, PROCESSED_DATABASE_NAME);

            var cursor = await dirtyDatabase.getObjects("schedules", {});

            var numCPUs = OS.cpus().length;
            console.log("Master: Will be forking " + numCPUs + " processes");
            for (let i = 0; i < numCPUs; i++){
                Cluster.fork();
            }       
            console.log("Master: Finished forking " + numCPUs + " processes"); 

            Cluster.on("message", async (worker, message, handle) => {
                var workerPID = worker.process.pid;            
                var workStatus = message;

                if (workStatus.status == 0){
                    if (await cursor.hasNext()){
                        var schedule = await cursor.next();

                        console.log("Master: Sending work " + schedule._id + " to worker #" + workerPID);
                        worker.send(schedule);
                        console.log("Master: Finished sending work " + schedule._id + " to worker #" + workerPID);
                    }
                    else{
                        console.log("Master: No more work to do for this worker #" + workerPID);
                        worker.kill();
                        console.log("Master: Killed worker #" + workerPID);
                    }
                }
            });
        }
        catch(error){
            if (dirtyDatabase)
                dirtyDatabase.closeDatabase();
            throw error;
        }
    }
    else{
        var pid = process.pid;
        console.log("Worker #" + pid + ": Connecting to the database");
        var dirtyDatabase = new Database();
        var finalDatabase = new Database();

        await dirtyDatabase.connectToDatabase(MONGODB_URL, PROCESSED_DATABASE_NAME);
        await finalDatabase.connectToDatabase(MONGODB_URL, FINAL_DATABASE_NAME);
        console.log("Worker #" + pid + ": Finished connecting to the database");

        // Tell the master process that it is ready to do a task
        var workStatus = {
            status: 0
        };
        console.log("Worker #" + pid + ": Sending request to do more work");
        process.send(workStatus);
        console.log("Worker #" + pid + ": Finished sending request to do more work");

        process.on("message", async message => {
            var schedule = message;

            console.log("Worker #" + pid + ": Got work to do " + schedule._id);

            var results = await finalDatabase.getObject("schedules", { "_id": schedule._id });
            if (results == null || results == undefined){
                console.log("Worker #" + pid + ": Doing work on " + schedule._id);

                var tripScheduleAggregator = new TripScheduleAggregator(dirtyDatabase, finalDatabase);
                var newSchedule = await tripScheduleAggregator.processSchedule(schedule);    
        
                await finalDatabase.saveObjectToDatabase("schedules", newSchedule); 

                console.log("Worker #" + pid + ": Finished work to do " + schedule._id);
            }
            else{
                console.log("Worker #" + pid + ": Work already done!");
            }

            var workStatus = {
                status: 0
            };
            console.log("Worker #" + pid + ": Sending request to do more work");
            process.send(workStatus);
            console.log("Worker #" + pid + ": Finished sending request to do more work");
        });

        process.on("exit", () => {
            await dirtyDatabase.closeDatabase();
            await finalDatabase.closeDatabase();
        });
    }
}

async function wasd(){
    var dirtyDatabase = null;
    var finalDatabase = null;

    try{
        dirtyDatabase = new Database();
        finalDatabase = new Database();

        await dirtyDatabase.connectToDatabase(MONGODB_URL, PROCESSED_DATABASE_NAME);
        await finalDatabase.connectToDatabase(MONGODB_URL, FINAL_DATABASE_NAME);

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

//mainSingle();
runParallel();
// saveRawData();
//mainParallel();
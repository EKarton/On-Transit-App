const express = require("express");
const process = require("process");
const Database = require("on-transit").Database;
const ErrorCodes = require("./constants").ERROR_CODES;

const TripDataService = require("./trip-data-service");

const config = require("./res/config");

const DATABASE_URI = config.DATABASE_URI;
const DATABASE_NAME = config.DATABASE_NAME;

var database = null;

module.exports = async function(){

    var app = express();

    database = new Database();
    await database.connectToDatabase(DATABASE_URI, DATABASE_NAME);

    var tripDataService = new TripDataService(database);

    var server_port = process.env.YOUR_PORT || process.env.PORT || config.DEFAULT_PORT;
    var server_host = process.env.YOUR_HOST || '0.0.0.0';

    app.get("/api/v1/trips/:tripID/schedules/:scheduleID", (request, response) => {
        let tripID = request.params.tripID;
        let scheduleID = request.params.scheduleID;

        console.log("Recieved request to get trip schedule details on ", tripID, " on process ", process.pid);
        console.log("Trip ID:" + tripID);
        console.log("Schedule ID: " + scheduleID);

        tripDataService.getTripScheduleData(tripID, scheduleID)
            .then(tripScheduleData => {

                var jsonResponse = {
                    status: "success",
                    data: tripScheduleData
                };

                response.setHeader('Content-Type', 'application/json');
                response.status(200).json(jsonResponse);
            })
            .catch(error => {
                let message = "";
                let statusCode = 500;
                if (error === ErrorCodes.TRIP_NOT_FOUND){
                    message = "Trip is not found";
                    statusCode = 401;
                }
                else if (error === ErrorCodes.SCHEDULE_NOT_FOUND){
                    message = "Schedule not found";
                    statusCode = 401;
                }
                else{
                    message = JSON.stringify(error);
                    statusCode = 500;
                }

                let responseBody = {
                    status: "failure",
                    message: message
                };
                response.setHeader('Content-Type', 'application/json');
                response.status(statusCode).json(responseBody);
            });
    });

    app.get("/api/v1/health", (req, res) => {
        res.status(200).send("OK");
    });

    app.listen(server_port, server_host, function() {
        console.log('Listening on port %d', server_port);
    });
};

process.on("SIGINT", async () => {
    if (database){
        await database.closeDatabase();
    }
    process.exit(-1);
});

process.on("exit", async () => {
    if (database){
        await database.closeDatabase();
    }
});
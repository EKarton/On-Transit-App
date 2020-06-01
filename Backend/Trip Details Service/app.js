"use strict";

const express = require("express");
const process = require("process");
const Database = require("./models//database");
const ErrorCodes = require("./models/constants").ERROR_CODES;

const TripDataService = require("./models/trip-data-service");

require('dotenv').config();

var database = null;

module.exports = async function () {

    let app = express();

    database = new Database();
    await database.connectToDatabase(process.env.MONGODB_URL);

    let tripDataService = new TripDataService(database);

    let server_port = process.env.PORT || 5002;

    app.get("/api/v1/transits/:transitID/trips/:tripID/schedules/:scheduleID", (request, response) => {
        let transitID = request.params.transitID;
        let tripID = request.params.tripID;
        let scheduleID = request.params.scheduleID;
        console.log(transitID);

        console.log("Request to get nearby trips received by process ", process.pid);
        console.log("Current time: " + (new Date()));

        tripDataService.getTripScheduleData(transitID, tripID, scheduleID)
            .then(tripScheduleData => {

                var jsonResponse = {
                    status: "success",
                    data: tripScheduleData
                };

                response.setHeader('Content-Type', 'application/json');
                response.status(200).json(jsonResponse);
                console.log("Finish time: " + (new Date()));
            })
            .catch(error => {
                let message = "";
                let statusCode = 500;
                if (error === ErrorCodes.TRIP_NOT_FOUND) {
                    message = "Trip is not found";
                    statusCode = 401;
                }
                else if (error === ErrorCodes.SCHEDULE_NOT_FOUND) {
                    message = "Schedule not found";
                    statusCode = 401;
                }
                else {
                    message = error.message;
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

    app.listen(server_port, function () {
        console.log('Listening on port %d', server_port);
    });
};

process.on("SIGINT", async () => {
    if (database) {
        await database.closeDatabase();
    }
    process.exit(-1);
});

process.on("exit", async () => {
    if (database) {
        await database.closeDatabase();
    }
});
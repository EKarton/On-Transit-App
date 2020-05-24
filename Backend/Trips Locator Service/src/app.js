"use strict";

const express = require("express");
const process = require("process");
const Config = require("./res/config");

const Database = require("./database");
const TripsLocator = require("./trips-locator");

var database = null;

/**
 * A class used to represent the entire application with handling and responding to 
 * HTTP requests.
 */
module.exports = async function () {

    let app = express();

    database = new Database();
    await database.connectToDatabase(Config.DATABASE_URI, Config.DATABASE_NAME);

    let tripsLocator = new TripsLocator(database);

    let server_port = process.env.YOUR_PORT || process.env.PORT || Config.WEB_APP_DEFAULT_PORT || 5000;
    let server_host = process.env.YOUR_HOST || '0.0.0.0';

    /**
     * Returns a set of trip IDs that are close to a location by a certain radius
     * Example of HTTP GET request:
     * https://localhost:3000/api/v1/master/trips?lat=43&long=-73.6&time=17:50:00
     */
    app.get("/api/v1/trips", (request, response) => {
        let latitude = parseFloat(request.query.lat);
        let longitude = parseFloat(request.query.long);
        let rawTime = request.query.time;
        let radius = Math.max(10, parseInt(request.query.radius));

        // Convert raw time to the number of seconds after midnight
        let timeSections = rawTime.split(":");
        let numHrsFromMidnight = parseInt(timeSections[0]);
        let numMinFromHr = parseInt(timeSections[1]);
        let numSecFromMin = parseInt(timeSections[2]);
        let numSecondsFromMidnight = numSecFromMin + (60 * numMinFromHr) + (3600 * numHrsFromMidnight);

        console.log("Request to get nearby trips received by process ", process.pid);

        let location = {
            latitude: latitude,
            longitude: longitude
        };
        console.log("Current time: " + (new Date()));

        tripsLocator.getTripIDsNearLocation(location, numSecondsFromMidnight, radius)
            .then(tripIDs => {
                let jsonResponse = {
                    status: "success",
                    data: {
                        tripIDs: tripIDs
                    }
                };

                response.setHeader('Content-Type', 'application/json');
                response.send(JSON.stringify(jsonResponse));
                console.log("Finish time: " + (new Date()));
            })
            .catch(error => {
                let responseBody = {
                    status: "failure",
                    data: {},
                    message: JSON.stringify(error)
                };

                response.setHeader('Content-Type', 'application/json');
                response.send(JSON.stringify(responseBody));
            });
    });

    app.get("/api/v1/health", (req, res) => {
        res.status(200).send("OK");
    });

    app.listen(server_port, server_host, function () {
        console.log('Listening on port %d', server_port);
    });
}

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
const express = require("express");
const process = require("process");
const Database = require("on-transit").Database;
const Location = require("on-transit").Location;

const TripsLocator = require("./trips-locator");

const config = require("./res/config");
const DATABASE_URI = config.DATABASE_URI;
const DATABASE_NAME = config.DATABASE_NAME;

/**
 * A class used to represent the entire application with handling and responding to 
 * HTTP requests.
 */
class App{

    async run(){
        var app = express();
        var server_port = process.env.YOUR_PORT || process.env.PORT || config.DEFAULT_PORT;
        var server_host = process.env.YOUR_HOST || '0.0.0.0';

        var database = new Database();
        await database.connectToDatabase(DATABASE_URI, DATABASE_NAME);//"mongodb://localhost:27017/", "clean-transit-data");

        var tripsLocator = new TripsLocator(database);

        /**
         * Returns a set of trip IDs that are close to a location by a certain radius
         * Example of HTTP GET request:
         * https://localhost:3000/api/v1/trips?lat=43&long=-73.6&time=17:50:00
         */
        app.get("/api/v1/trips", (request, response) => {
            var latitude = request.query.lat;
            var longitude = request.query.long;
            var rawTime = request.query.time;

            console.log("Request to get nearby trips received by process ", process.pid);

            // Convert raw time to the number of seconds after midnight
            var timeSections = rawTime.split(":");
            var numHrsFromMidnight = parseInt(timeSections[0]);
            var numMinFromHr = parseInt(timeSections[1]);
            var numSecFromMin = parseInt(timeSections[2]);
            var numSecondsFromMidnight = numSecFromMin + (60 * numMinFromHr) + (3600 * numHrsFromMidnight);

            var location = new Location(latitude, longitude);
            
            tripsLocator.getTripIDsNearLocation(location, numSecondsFromMidnight)
                .then(tripIDs => {
                    var jsonResponse = {
                        status: "success",
                        data: {
                            tripIDs: tripIDs
                        }
                    };

                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify(jsonResponse));  
                })
                .catch(error => {
                    var responseBody = {
                        status: "failure",
                        data: {},
                        message: JSON.stringify(error)
                    };

                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify(responseBody));   
                });
        });

        app.listen(server_port, server_host, function() {
            console.log('Listening on port %d', server_port);
        });
    }
}

module.exports = App;
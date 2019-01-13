const express = require("express");
const process = require("process");
const Database = require("on-transit").Database;

const TripDataService = require("./trip-data-service");

const config = require("./res/config");

const DATABASE_URI = config.DATABASE_URI;
const DATABASE_NAME = config.DATABASE_NAME;

class App{
    run(){
        var app = express();

        var database = new Database();
        database.connectToDatabase(DATABASE_URI, DATABASE_NAME);//"mongodb://localhost:27017/", "clean-transit-data");

        var tripDataService = new TripDataService(database);

        var server_port = process.env.YOUR_PORT || process.env.PORT || config.DEFAULT_PORT;
        var server_host = process.env.YOUR_HOST || '0.0.0.0';

        /**
         * Returns the trip details given its trip ID.
         * Example of HTTP GET request:
         * http://localhost:3000/api/v1/trips/123456
         */
        app.get("/api/v1/trips/:tripID", (request, response) => {
            var tripID = request.params.tripID;

            console.log("Recieved request to get trip details on ", tripID, " on process ", process.pid);

            tripDataService.getTripData(tripID)
                .then(tripData => {

                    var jsonResponse = {
                        status: "success",
                        data: tripData
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

        app.get("/api/v1/health", (req, res) => {
            res.status(200).send("OK");
        });

        app.listen(server_port, server_host, function() {
            console.log('Listening on port %d', server_port);
        });
    }
}

module.exports = App;
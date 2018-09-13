const express = require("express");
const request = require('request-promise-native');
const process = require("process");

const config = require("./res/config");

/**
 * A class used to represent the entire application with handling and responding to 
 * HTTP requests.
 */
class App{

    run(){
        var app = express();

        var server_port = process.env.YOUR_PORT || process.env.PORT || config.DEFAULT_PORT;
        var server_host = process.env.YOUR_HOST || '0.0.0.0';

        /**
         * Returns a set of trip IDs that are close to a location by a certain radius
         * Example of HTTP GET request:
         * https://localhost:3000/api/v1/trips?lat=43&long=-73.6&time=17:50:00
         */
        app.get("/api/v1/trips", (request, response) => {
            var latitude = request.query.lat;
            var longitude = request.query.long;
            var rawTime = request.query.time;

            var uri = `http://localhost:3002/api/v1/trips?lat=${latitude}&long=${longitude}&time=${rawTime}`;
            request(uri)
                .then(message => {
                    response.json(message);
                    response.setHeader('Content-Type', 'application/json');
                })
                .catch(error => {
                    console.log(error);
                });
        });

        /**
        * Returns the trip details given its trip ID.
        * Example of HTTP GET request:
        * http://localhost:3000/api/v1/trips/123456
        */
        app.get("/api/v1/trips/:tripID", (request, response) => {
            var tripID = request.params.tripID;

            var uri = `http://localhost:3003/api/v1/trips/${tripID}`;
            request(uri)
                .then(message => {
                    response.json(message);
                    response.setHeader('Content-Type', 'application/json');
                })
                .catch(error => {
                    console.log(error);
                });
        });

        /**
         * Returns the vehicles and its position close to a location by a certain radius
         * Example of HTTP request:
         * http://localhost:3000/api/v1/vehicles?lat=43&long=-73.6&radius=40
         */
        app.get("/api/v1/vehicles", (request, response) => {
            var latitude = request.query.lat;
            var longitude = request.query.long;
            var radius = request.query.radius;

            var uri = `http://localhost:3001/api/v1/vehicles?lat=${latitude}&long=${longitude}&radius=${radius}`;

            console.log("Request for finding vehicle recieved on process #", process.pid);
            request(uri)
                .then(message => {
                    response.json(message);
                    response.setHeader('Content-Type', 'application/json');
                })
                .catch(error => {
                    console.log(error);
                });
        });

        app.listen(server_port, server_host, function() {
            console.log('Listening on port %d', server_port);
        });
    }
}

module.exports = App;


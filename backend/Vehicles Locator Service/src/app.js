const express = require("express");
const process = require("process");

const VehicleLocator = require("./vehicles-locator");

const config = require("./res/config");

const GTFS_VEHICLES_URI = config.GTFS_VEHICLES_URI;

/**
 * A class used to represent the entire application with handling and responding to 
 * HTTP requests.
 */
class App{

    run(){
        var app = express();

        var vehicleLocator = new VehicleLocator(GTFS_VEHICLES_URI);

        var server_port = process.env.YOUR_PORT || process.env.PORT || config.DEFAULT_PORT;
        var server_host = process.env.YOUR_HOST || '0.0.0.0';

        /**
         * Returns the vehicles and its position close to a location by a certain radius
         * Example of HTTP request:
         * http://localhost:3000/api/v1/vehicles?lat=43&long=-73.6&radius=40
         */
        app.get("/api/v1/vehicles", (request, response) => {
            var latitude = request.query.lat;
            var longitude = request.query.long;
            var radius = request.query.radius;

            console.log("Request for finding vehicle recieved on process #", process.pid);

            vehicleLocator.getNearbyVehiclesByLocation(latitude, longitude, radius)
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


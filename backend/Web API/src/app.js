const express = require("express");
const app = express();
const Database = require("./database");
const VehicleLocator = require("./vehicles-locator");
const TripDataService = require("./trip-data-service");
const TripsLocator = require("./trips-locator");

var database = new Database();
database.connectToDatabase("mongodb://localhost:27017/", "miway-gtfs-static-data");

var tripDataService = new TripDataService(database);
var vehicleLocator = new VehicleLocator("https://www.miapp.ca/GTFS_RT/Vehicle/VehiclePositions.pb");
var tripsLocator = new TripsLocator(database);

/**
 * Returns a set of trip IDs that are close to a location by a certain radius
 * Example of HTTP GET request:
 * https://localhost:3000/api/v1/trips?lat=43&long=-73.6&radius=40
 */
app.get("/api/v1/trips", (request, response) => {
    var latitude = request.query.lat;
    var longitude = request.query.long;
    var radius = request.query.radius;
    var rawTime = request.query.time;

    // Convert raw time to the number of seconds after midnight
    var timeSections = rawTime.split(":");
    var numHrsFromMidnight = parseInt(timeSections[0]);
    var numMinFromHr = parseInt(timeSections[1]);
    var numSecFromMin = parseInt(timeSections[2]);
    var numSecondsFromMidnight = numSecFromMin + (60 * numMinFromHr) + (3600 * numHrsFromMidnight);
    
    tripsLocator.getTripIDsNearLocation(latitude, longitude, radius, numSecondsFromMidnight)
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
                message: error
            };

            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify(responseBody));   
        });
});

/**
 * Returns the trip details given its trip ID.
 * Example of HTTP GET request:
 * http://localhost:3000/api/v1/trips/123456
 */
app.get("/api/v1/trips/:tripID", (request, response) => {
    var tripID = request.params.tripID;
    tripDataService.getTripData(tripID)
        .then(tripData => {

            var jsonResponse = {
                status: "success",
                data: tripData
            };

            response.setHeader("Content-Type", "application/json");
            response.send(JSON.stringify(jsonResponse));
        })
        .catch(error => {
            var responseBody = {
                status: "failure",
                data: {},
                message: error
            };

            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify(responseBody));      
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
                message: error
            };

            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify(responseBody));    
        });  
});

app.listen(3000, () => {
    console.log("Server now listening on port 3000");
});
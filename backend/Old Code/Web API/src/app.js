const express = require("express");
const Database = require("on-transit").Database;
const Location = require("on-transit").Location;

const VehicleLocator = require("./vehicles-locator");
const TripDataService = require("./trip-data-service");
const TripsLocator = require("./trips-locator");

const config = require("./res/config");

const DATABASE_URI = config.DATABASE_URI;
const DATABASE_NAME = config.DATABASE_NAME;
const GTFS_VEHICLES_URI = config.GTFS_VEHICLES_URI;

var app = express();

var database = new Database();
database.connectToDatabase(DATABASE_URI, DATABASE_NAME);//"mongodb://localhost:27017/", "clean-transit-data");

var tripDataService = new TripDataService(database);
var vehicleLocator = new VehicleLocator(GTFS_VEHICLES_URI);
var tripsLocator = new TripsLocator(database);

var server_port = process.env.YOUR_PORT || process.env.PORT || config.DEFAULT_PORT;
var server_host = process.env.YOUR_HOST || '0.0.0.0';

/**
 * Returns a set of trip IDs that are close to a location by a certain radius
 * Example of HTTP GET request:
 * https://localhost:3000/api/v1/trips?lat=43&long=-73.6&time=17:50:00
 */
app.get("/api/v1/trips", (request, response) => {
    response.setTimeout(600000);

    var latitude = request.query.lat;
    var longitude = request.query.long;
    var rawTime = request.query.time;

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
                message: JSON.stringify(error)
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
                message: JSON.stringify(error)
            };

            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify(responseBody));    
        });  
});

app.listen(server_port, server_host, function() {
    console.log('Listening on port %d', server_port);
});
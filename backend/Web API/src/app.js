const express = require("express");
const app = express();
const Database = require("./database");
const VehicleLocator = require("./vehicles-locator");
const TripDataService = require("./trip-data-service");

var database = new Database();
database.connectToDatabase("mongodb://localhost:27017/", "miway-gtfs-static-data");

var tripDataService = new TripDataService(database);
var vehicleLocator = new VehicleLocator("https://www.miapp.ca/GTFS_RT/Vehicle/VehiclePositions.pb");
var tripsLocator = new tripsLocator(database);

app.get("/api/v1/routes", (request, response) => {
    var latitude = request.query.lat;
    var longitude = request.query.long;
    var radius = request.query.radius;
    
    tripsLocator.getTripIDsNearLocation(latitude, longitude, radius)
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

app.get("/api/v1/routes/:routeID", (request, response) => {
    var routeID = request.params.routeID;
    tripDataService.getTripData(routeID)
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
"use strict";

const CSV = require("fast-csv");
const AdmZip = require('adm-zip');
const request = require('request');
const fs = require("fs");

const Path = require("./path");
const Route = require("./route");
const Stop = require("./stop");
const Location = require("./location");

var stopLocations = {};
var nextStopLocationID = 0;

var uniqueStops = {};
var stopIDsToUniqueStopIDs = {};

var pathLocations = {};
var nextPathLocationID = 0;

var uniquePaths = {};
var pathIDToUniquePathID = {};

var uniqueRoutes = {};
var routeIDToUniqueRoutes = {};

var uniqueTrips = {};
var tripIDsToUniqueTripIDs = {};

class DataCollector{

    downloadAndExtractGtfsData(url){
        var requestSettings = {
            method: 'GET',
            url: url,
            encoding: null
        };

        return new Promise((resolve, reject) => {

            // Download the Zip file
            request(requestSettings)
                .on("error", error => {
                    console.log("ERROR! " + error);
                    reject(error);
                })
                .pipe(fs.createWriteStream("tmp/master.zip"))
                .on("finish", () => {
                    
                    // Extract the ZIP file
                    console.log("finished downloading");
                    var zip = new AdmZip("tmp/master.zip");
                    zip.extractAllToAsync("tmp/extracted-gtfs-static-files", true, error => {
                        if (error){
                            reject(error);
                        }
                        else{
                            console.log("Finished downloading!");
                            resolve();
                        }
                    });
                });
        });
    }

    storeStopLocation(location){
        stopLocations[nextStopLocationID] = location;
        var curStopLocationID = nextStopLocationID;
        nextStopLocationID ++;

        return curStopLocationID;
    }

    getStopLocation(stopLocationID){
        return stopLocations[stopLocationID];
    }

    storePathLocation(location){
        pathLocations[nextPathLocationID] = location;
        var curPathLocationID = nextPathLocationID;
        nextPathLocationID ++;
        
        return curPathLocationID;
    }

    getPathLocation(pathLocationID){
        return pathLocations[pathLocationID];
    }

    parseTrips(filePath){
        return new Promise((resolve, reject) => {
            uniqueTrips = {};
            tripIDsToUniqueTripIDs = {};

            var fileStream = fs.createReadStream(filePath);
            CSV.fromStream(fileStream, { headers: true } )
                .on("data", rawTripEntry => {
                    var rawRouteID = rawTripEntry.route_id;
                    var rawTripID = rawTripEntry.trip_id;
                    var rawTripHeadsign = rawTripEntry.trip_headsign;
                    var rawShapeID = rawTripEntry.shape_id;

                    var routeID = routeIDToUniqueRoutes[rawRouteID];
                    var pathID = pathIDToUniquePathID[rawShapeID];

                    var newTrip = {
                        tripID: rawTripID,
                        routeID: routeID,
                        tripHeadSign: rawTripHeadsign,
                        pathID: pathID
                    };

                    var isUniqueTrip = true;
                    var foundUniqueTripID = null;
                    Object.keys(uniqueTrips).forEach(key => {
                        if (!isUniqueTrip)
                            return;

                        var uniqueTrip = uniqueTrips[key];
                        foundUniqueTripID = key;

                        if (uniqueTrip.routeID == newTrip.routeID){
                            if (uniqueTrip.pathID == newTrip.pathID){
                                if (uniqueTrip.tripHeadSign == newTrip.tripHeadSign)
                                    isUniqueTrip = false;
                            }
                        }
                    });

                    if (isUniqueTrip){
                        uniqueTrips[newTrip.tripID] = newTrip;
                        tripIDsToUniqueTripIDs[newTrip.tripID] = newTrip.tripID;
                    }
                    else{
                        tripIDsToUniqueTripIDs[newTrip.tripID] = foundUniqueTripID;
                    }
                })
                .on("error", error => {
                    reject(error);
                })
                .on("end", () => {
                    var dataToBeReturned = {
                        uniqueTrips: uniqueTrips,
                        tripIDsToUniqueTripIDs: tripIDsToUniqueTripIDs
                    };
                    resolve(dataToBeReturned);
                });
        });
    }

    parseStops(filePath){
        return new Promise((resolve, reject) => {
            uniqueStops = {};
            stopIDsToUniqueStopIDs = {};

            var fileStream = fs.createReadStream(filePath);
            CSV.fromStream(fileStream, { headers: true} )
                .on("data", rawStopEntry => {
                    var stopName = rawStopEntry.stop_name;
                    var stopLatitude = rawStopEntry.stop_lat;
                    var stopLongitude = rawStopEntry.stop_lon;
                    var stopID = rawStopEntry.stop_id;

                    var stopLocation = new Location(stopLatitude, stopLongitude);
                    var stopLocationID = this.storeStopLocation(stopLocation);
                    var stop = new Stop(stopLocationID, stopName);

                    var isUniqueStop = true;
                    var foundUniqueStopID = null;
                    Object.keys(uniqueStops).forEach(key => {
                        if (!isUniqueStop)
                            return;

                        var uniqueStop = uniqueStops[key];
                        foundUniqueStopID = key;
                        if (stop.locationID == uniqueStop.locationID){
                            if (stop.name == stop.name){
                                isUniqueStop = false;
                            }
                        }
                    });

                    if (isUniqueStop){
                        uniqueStops[stopID] = stop;
                        stopIDsToUniqueStopIDs[stopID] = stopID;
                    }
                    else{
                        stopIDsToUniqueStopIDs[stopID] = foundUniqueStopID;
                    }
                })
                .on("error", error => {
                    reject(error);
                })
                .on("end", () => {
                    var dataToBeReturned = {
                        uniqueStops: uniqueStops,
                        stopIDsToUniqueStopIDs: stopIDsToUniqueStopIDs,
                        stopLocations: stopLocations
                    };
                    resolve(dataToBeReturned);
                });
        });
    }

    parseRoutes(filePath){
        return new Promise((resolve, reject) => {
            uniqueRoutes = {};
            routeIDToUniqueRoutes = {};

            var fileStream = fs.createReadStream(filePath);
            CSV.fromStream(fileStream, { headers: true })
                .on("data", rawRouteEntry => {                    
                    var route = new Route();
                    route.agencyID = rawRouteEntry.agency_id;
                    route.shortName = rawRouteEntry.route_short_name;
                    route.longName = rawRouteEntry.route_long_name;
                    route.type = rawRouteEntry.route_type;

                    var routeID = rawRouteEntry.route_id;

                    var isUniqueRoute = true;
                    var foundUniqueRouteID = null;
                    Object.keys(uniqueRoutes).forEach(uniqueRouteID => {
                        if (!isUniqueRoute)
                            return;

                        foundUniqueRouteID = uniqueRouteID;
                        var uniqueRoute = uniqueRoutes[uniqueRouteID];

                        if (uniqueRoute.shortName == route.shortName){
                            if (uniqueRoute.longName == route.longName){
                                if (uniqueRoute.agencyID == route.agencyID){
                                    if (uniqueRoute.type == route.type)
                                        isUniqueRoute = false;
                                }
                            }
                        }
                    });

                    if (isUniqueRoute){
                        uniqueRoutes[routeID] = route;
                        routeIDToUniqueRoutes[routeID] = routeID;
                    }
                    else{
                        routeIDToUniqueRoutes[routeID] = foundUniqueRouteID;
                    }
                })
                .on("error", error => {
                    reject(error);
                })
                .on("end", () => {
                    var dataToBeReturned = {
                        uniqueRoutes: uniqueRoutes,
                        routeIDToUniqueRoutes: routeIDToUniqueRoutes
                    };
                    resolve(dataToBeReturned);
                });
        });
    }

    parsePaths(filePath){
        return new Promise((resolve, reject) => {
            uniquePaths = {};
            pathIDToUniquePathID = {};

            // A data structure that maps shapeID to a list of coordinates by order of shape_sequence.
            var paths = {};

            var fileStream = fs.createReadStream(filePath);
            CSV.fromStream(fileStream, { headers: true })
                .on("data", shape => {
                    var shapeID = shape.shape_id;

                    if (paths[shapeID] == undefined){
                        paths[shapeID] = new Path();
                    }

                    var newPathLocation = new Location(shape.shape_pt_lat, shape.shape_pt_lon);
                    var locationID = this.storePathLocation(newPathLocation);

                    paths[shapeID].addPoint(
                        locationID,
                        newPathLocation,
                        shape.shape_pt_sequence,
                    );
                })
                .on("error", error => {
                    reject(error);
                })
                .on("end", () => {
                    
                    // Sort the shapes[] for each shapeID by their sequence
                    Object.keys(paths).forEach(shapeID => {
                        paths[shapeID].points.sort((a, b) => {
                            if (parseInt(a.order) < parseInt(b.order)){
                                return -1;
                            }
                            else {
                                return 1;
                            }
                        })
                    });

                    // Parse each shape in shapeIDToShapes{} as a Path object
                    // and remove any duplicates
                    Object.keys(paths).forEach(shapeID => {
                        var isUnique = true;
                        var foundUniquePathID = null;

                        Object.keys(uniquePaths).forEach(uniquePathID => {
                            if (!isUnique)
                                return;

                            var path = uniquePaths[uniquePathID];
                            foundUniquePathID = uniquePathID;
                            var otherPath = paths[shapeID];

                            if (path.equals(otherPath)){
                                isUnique = false;
                            }
                        });

                        if (isUnique){
                            uniquePaths[shapeID] = paths[shapeID];
                            pathIDToUniquePathID[shapeID] = shapeID;
                        }
                        else{
                            pathIDToUniquePathID[shapeID] = foundUniquePathID;
                        }
                    });

                    var dataToBeReturned = {
                        uniquePaths: uniquePaths,
                        pathIDToUniquePathID: pathIDToUniquePathID
                    };
                    resolve(dataToBeReturned);
                });
        });
    }
}

module.exports = DataCollector;
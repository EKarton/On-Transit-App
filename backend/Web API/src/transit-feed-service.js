"use strict;"

const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const CSV = require("fast-csv");
const Unzip = require('unzip');
const request = require('request');
const fs = require("fs");
const Circle = require("./circle");
const Vector = require("./vector");
const Geometry = require("./geometry");

const EARTH_RADIUS = 6371000; // in meters

class TransitFeedService{

    /**
     * Converts degrees to radians
     * @param {number} degrees Angle in degrees
     * @return {number} Angle in radians
     */
    _convertDegreesToRadians(degrees){
        return degrees * Math.PI / 180;
    }

    /**
     * Calculates and returns the distance between two points.
     * Formula derived from https://www.movable-type.co.uk/scripts/latlong.html
     * @param {number} lat_1 The latitude of point 1
     * @param {number} long_1 The longitude of point 1
     * @param {number} lat_2 The latitude of point 2 
     * @param {number} long_2 The longitude of point 2
     * @return {number} Returns the distance between two points in meters
     */
    _calculateDistance(lat1, long1, lat2, long2){
        var dLat = this._convertDegreesToRadians(lat2 - lat1);
        var dLong = this._convertDegreesToRadians(long2 - long1);
        var lat1_rads = this._convertDegreesToRadians(lat1);
        var lat2_rads = this._convertDegreesToRadians(lat2);

        var a = Math.pow(Math.sin(dLat / 2), 2) +
                Math.pow(Math.sin(dLong / 2), 2) * 
                Math.cos(lat1_rads) * Math.cos(lat2_rads); 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return EARTH_RADIUS * c;
    }

    /**
     * Parses and returns a list of shapes based on their shape_id.
     * @param {string} filePath The file path to the csv file containing the shapes. 
     *  It must be relative to the project directory
     */
    _getShapes(filePath){
        var fileStream = fs.createReadStream(filePath);
        return new Promise((resolve, reject) => { 

            var shapes = {};

            CSV.fromStream(fileStream, { headers: true })
                .on("data", (data) => {
                    // This method is called each time a row is parsed in the csv file
                    // "data" is an object representation of a row in the csv file, 
                    // with the csv headers as the object's property names.
                    
                    if (shapes[data.shape_id] == undefined){
                        shapes[data.shape_id] = {};
                    }

                    if (shapes[data.shape_id][data.shape_pt_sequence] != undefined){
                        throw new Error("The shape_pt_sequence is not unique!");
                    }

                    var shapePoint = new Vector(data.shape_pt_lat, data.shape_pt_lon);
                    shapes[data.shape_id][data.shape_pt_sequence] = shapePoint;

                }).on("end", () => {
                    // This callback gets called when it has finished parsing the csv file.

                    var results = {};
                    for (let shapeID in shapes){
                        results[shapeID] = [];

                        let points = shapes[shapeID];
                        for (let pointID in points){
                            let point = points[pointID];
                            results[shapeID].push(point);
                        }
                    }

                    resolve(results);
                });
        });
    }

    _getRoutes(filePath){
        return new Promise((resolve, reject) => { 
            var routes = {};

            var fileStream = fs.createReadStream(filePath);
            CSV.fromStream(fileStream, { headers: true })
                .on("data", data => {
                    if (routes[data.route_id] == undefined){
                        routes[data.route_id] = {
                            agencyID: data.agency_id,
                            routeShortName: data.route_short_name,
                            routeLongName: data.route_long_name,
                            routeDescription: data.route_desc,
                            routeType: data.route_type,
                            routeUrl: data.route_url,
                            routeColor: data.route_color,
                            routeTextColor: data.route_text_color
                        };
                    }

                    else{
                        reject("The route_id is not unique! " + data.route_id);
                    }
                }).on("end", () => {
                    resolve(routes);
                });
        });
    }

    _getTrips(filePath){
        return new Promise((resolve, reject) => { 
            var trips = {};

            var fileStream = fs.createReadStream(filePath);
            CSV.fromStream(fileStream, { headers: true })
                .on("data", data => {
                    if (trips[data.trip_id] == undefined){
                        trips[data.trip_id] = {
                            routeID: data.route_id,
                            serviceID: data.service_id,
                            tripHeadSign: data.trip_headsign,
                            tripShortName: data.trip_short_name,
                            directionID: data.direction_id,
                            blockID: data.block_id,
                            shapeID: data.shape_id,
                            wheelchairAssessible: data.wheelchair_accessible,
                            bikesAllowed: data.bikes_allowed
                        };
                    }

                    else{
                        reject("The route_id is not unique! " + data.route_id);
                    }
                }).on("end", () => {
                    resolve(trips);
                });
        });
    }

    downloadAndExtractGtfsData(){
        var requestSettings = {
            method: 'GET',
            url: 'https://www.miapp.ca/GTFS/google_transit.zip',
            encoding: null
        };

        return new Promise((resolve, reject) => {
            var requestStream = request(requestSettings, (error, response, body) => {
                if (error || response.code != 200){
                    reject(error);
                }
            });

            // Extract the files to a directory.
            requestStream.pipe(Unzip.Extract({ path: "src/miway-gfts-files" }))
            .end(() => {
                resolve();
            });
        });
    }

    /**
     * Returns a list of transit lines that is close to a location by a certain radius
     * @param {number} latitude 
     * @param {number} longitude 
     * @param {number} radius
     * @returns {Promise} A promise
     */
    getNearbyVehiclesByLocation(latitude, longitude, radius){        
        var requestSettings = {
            method: 'GET',
            url: 'https://www.miapp.ca/GTFS_RT/Vehicle/VehiclePositions.pb',
            encoding: null
        };

        return new Promise((resolve, reject) => {
            request(requestSettings, (error, response, body) => {
                if (error || response.statusCode != 200){
                    reject(error);
                    return;
                }

                var feed = GtfsRealtimeBindings.FeedMessage.decode(body);

                var validVehicles = [];
                var index = 0;

                feed.entity.forEach(entity => {
                    var vehiclePosition_latitude = entity.vehicle.position.latitude;
                    var vehiclePosition_longitude = entity.vehicle.position.longitude;

                    var distance = this._calculateDistance(latitude, longitude, 
                        vehiclePosition_latitude, vehiclePosition_longitude);

                    if (distance < radius){
                        var vehicle = {
                            id: entity.id,
                            lat: vehiclePosition_latitude,
                            long: vehiclePosition_longitude,
                            routeID: entity.vehicle.trip.trip_id
                        }
                        validVehicles.push(vehicle);
                    }

                    index ++;
                    if (index >= feed.entity.length){
                        resolve(validVehicles);
                    }
                });
            });
        });
    }

    _getNearbyRoutesByLocation(shapes, routes, trips, geofence){
        // Build a relational map
        var shapeIDToTripIDs = {};
        var tripIDToRouteID = {};
        var routeIDToTripIDs = {};

        for (let tripID in trips){
            let shapeID = trips[tripID].shapeID;
            
            if (shapeIDToTripIDs[shapeID] == undefined){
                shapeIDToTripIDs[shapeID] = [];
            }

            shapeIDToTripIDs[shapeID].push(tripID);

            let routeID = trips[tripID].routeID;
            tripIDToRouteID[tripID] = routeID;

            if (routeIDToTripIDs[routeID] == undefined){
                routeIDToTripIDs[routeID] = [];
            }
            routeIDToTripIDs[routeID].push(tripID);
        }

        console.log(shapeIDToTripIDs);
        // Find the shapes that are in the geofence
        var response = {
            tripIDToRouteID: {},
            tripIDToShapeID: {},
            routeIDToRouteDetails: {},
            tripIDToTripDetails: {},
            shapeIDToShapeDetails: {}
        };

        for (let shapeID in shapes){
            let points = shapes[shapeID];

            // Test if the shape is in the geofence
            let shapeInGeofence = false;
            for (let i = 1; i < points.length; i++){
                let point1 = points[i - 1];
                let point2 = points[i];

                let isInCircle = false;

                // Case 1: If the line segment is in the circle
                if (Geometry.isPointInCircle(point1, geofence) || Geometry.isPointInCircle(point2, geofence)){
                    isInCircle = true;
                }

                // Case 2: If the line segment intersects the circle
                else if (Geometry.isLineSegmentIntersectCircle(point1, point2, geofence)){
                    isInCircle = true;
                }

                // When this shape is found stop the loop
                if (isInCircle){
                    shapeInGeofence = true;
                    break;
                }
            };

            // var response = {
            //     routeIDToTripID: {},
            //     tripIDToShapeID: {},
            //     routeIDToRouteDetails: {},
            //     tripIDToTripDetails: {},
            //     shapeIDToShapeDetails: {}
            // };
            if (shapeInGeofence){
                // Add the shape details
                response.shapeIDToShapeDetails[shapeID] = shapes[shapeID];

                // Add the trips that are part of this shape
                let tripIDs = shapeIDToTripIDs[shapeID];
                tripIDs.forEach(tripID => {
                    response.tripIDToShapeID[tripID] = shapeID;

                    if (response.tripIDToTripDetails[tripID] == undefined){
                        response.tripIDToTripDetails[tripID] = trips[tripID];
                    }

                    // Add the routes that are part of this trip
                    let routeID = tripIDToRouteID[tripID];
                    response.tripIDToRouteID[tripID] = routeID;

                    if (response.routeIDToRouteDetails[routeID] == undefined){
                        response.routeIDToRouteDetails[routeID] = routes[routeID];
                    }
                });
            }
        }
        return response;
    }

    /**
     * Returns a list of transit routes that are close to a location at a certain radius
     * @param {number} latitude The latitude of a point
     * @param {number} longitude The longitude of a point
     * @param {number} radius The radius
     * @return {Promise} A promise
     */
    getNearbyRoutesByLocation(latitude, longitude, radius){
        return new Promise((resolve, reject) => {

            var geofence = new Circle(new Vector(latitude, longitude), radius);

            this._getShapes("src/miway-gfts-files/shapes.txt")
                .then(shapesPromiseResult => {
                    this._getRoutes("src/miway-gfts-files/routes.txt")
                        .then(routesPromiseResult => {
                            this._getTrips("src/miway-gfts-files/trips.txt")
                                .then(tripsPromiseResult => {
                                    var shapes = shapesPromiseResult;
                                    var routes = routesPromiseResult;
                                    var trips = tripsPromiseResult;

                                    var result = this._getNearbyRoutesByLocation(shapes, routes, trips, geofence);
                                    resolve(result);
                                })
                                .catch(tripsPromiseError => {
                                    reject(tripsPromiseError);
                                });
                        })
                        .catch(routesPromiseError => {
                            reject(routesPromiseError);
                        });
                })
                .catch(shapesPromiseError => {
                    reject(shapesPromiseError);
                });
        });
    }
}

module.exports = TransitFeedService;
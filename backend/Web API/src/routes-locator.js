const MongoClient = require('mongodb').MongoClient;

const Vector = require("./vector");
const Geography = require("./geography");
const Circle = require("./circle");
const Geometry = require("./geometry");

const url = "mongodb://localhost:27017/";

class RoutesLocator{

    constructor(routesDatasource){

    }

    _getPathLoc(dbo, locationID){
        return new Promise(async (resolve, reject) => {
            var pathLocations = [];
            var cursor = dbo.collection("pathLocations").find({ "_id": locationID });
            while(await cursor.hasNext() && pathLocations.length == 0){
                var pathLocation = await cursor.next();
                pathLocations.push(pathLocation);
            }
            cursor.close((error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(pathLocation); 
            });
        });
    }

    _getPathIDsNearGeofence(dbo, geofence){
        return new Promise(async (resolve, reject) => {
            var pathIDs = [];
            var cursor = dbo.collection("paths").find();

            while(await cursor.hasNext()){
                var path = await cursor.next();
                var pathID = path._id;
                var pathLocationIDs = path.points;

                // Check if the first path location is in geofence
                var rawFirstPathLoc = null;
                var rawLastPathLoc = null;

                try{
                    rawFirstPathLoc = await this._getPathLoc(dbo, pathLocationIDs[0]);
                    var lastPathLocIndex = pathLocationIDs.length - 1;
                    rawLastPathLoc = await this._getPathLoc(dbo, pathLocationIDs[lastPathLocIndex]);
                }
                catch(error){
                    reject(error);
                }

                var firstPathLoc = new Vector(rawFirstPathLoc.longitude, rawFirstPathLoc.latitude);
                var lastPathLoc = new Vector(rawLastPathLoc.longitude, rawLastPathLoc.latitude);

                if (Geography.calculateDistance(firstPathLoc, geofence.centerPt) <= geofence.radius){
                    pathIDs.push(pathID);
                }
                else if (Geography.calculateDistance(lastPathLoc, geofence.centerPt) <= geofence.radius){
                    pathIDs.push(pathID);
                }
                else{
                    for (let i = 1; i < pathLocationIDs.length; i++){
                        var pathLocID_1 = pathLocationIDs[i - 1];
                        var pathLocID_2 = pathLocationIDs[i];
                        
                        var rawPathLoc_1 = null;
                        var rawPathLoc_2 = null;
                        try{
                            rawPathLoc_1 = await this._getPathLoc(dbo, pathLocID_1);
                            rawPathLoc_2 = await this._getPathLoc(dbo, pathLocID_2);
                        }
                        catch(error){
                            reject(error);
                        }

                        var pathLoc_1 = new Vector(rawPathLoc_1.longitude, rawPathLoc_1.latitude);
                        var pathLoc_2 = new Vector(rawPathLoc_2.longitude, rawPathLoc_2.latitude);

                        if (Geography.isStraightPathInGeofence(pathLoc_1, pathLoc_2, geofence)){
                            pathIDs.push(pathID);
                            break;
                        }
                    }
                }
            }

            cursor.close((error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(pathIDs);
            });
        });
    }

    _getTripsFromPathID(dbo, pathID){
        return new Promise(async (resolve, reject) => {
            var tripIDToTripDetails = [];
            var cursor = dbo.collection("trips").find({ "pathID": pathID });
            while (await cursor.hasNext()){
                var trip = await cursor.next();
                var tripID = trip._id;
                tripIDToTripDetails[tripID] = trip;
            }

            cursor.close((error, result) => {
                if (error)
                    reject(error);

                resolve(tripIDToTripDetails);
            });
        });
    }

    getRoutesNearLocation(latitude, longitude, radius){
        /**
         * Pseudocode:
         * unique_trips = []
         * for (path in paths):
         *      if path in geofence:
         *          for trip in path.trips:
         *              if trip_id not in unique_trips:
         *                  unique_trips.add(trip_id)
         * 
         * return unique_trips
         */

        return new Promise((resolve, reject) => {
            var geofence = new Circle(new Vector(longitude, latitude), radius);
            MongoClient.connect(url, async (err, db) => {
                if (err) 
                    reject(err);

                var dbo = db.db("miway-gtfs-static-data");
                try{
                    var pathIDs = await this._getPathIDsNearGeofence(dbo, geofence);
                    var trips = [];
                    var visitedTripIDs = {};

                    for (let i = 0; i < pathIDs.length; i++){
                        var pathID = pathIDs[i];
                        var tripIDToTripDetails = await this._getTripsFromPathID(dbo, pathID);

                        Object.keys(tripIDToTripDetails).forEach(tripID => {
                            if (visitedTripIDs[tripID] === undefined){
                                visitedTripIDs[tripID] = true;
                                trips.push(tripIDToTripDetails[tripID]);
                            }
                        });
                    }

                    resolve(trips);
                }
                catch(error){
                    reject(error);
                }                
            });
        });
    }
}

module.exports = RoutesLocator;
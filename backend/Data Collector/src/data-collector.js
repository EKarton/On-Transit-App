"use strict";

const MongoClient = require('mongodb').MongoClient;
const CSV = require("fast-csv");
const fs = require("fs");
const path = require("path");
const request = require("request");
const AdmZip = require('adm-zip');

const LocationBag = require("./location-bag");
const Location = require("./location");
const Path = require("./path");

const DOWNLOADS_DIRECTORY = "tmp/extracted-gtfs-static-files";
const MONGODB_URL = "mongodb://localhost:27017/";
const DATABASE_NAME = "miway-gtfs-static-data";

/**
 * This data collector will basically download the data and store them in Mongo DB as is
 * without any data compressions.
 */
class DataCollector{

    /**
     * Clears any files in the DOWNLOADS_DIRECTORY.
     * Pre-condition: "DOWNLOADS_DIRECTORY" must be present which is relative to 
     *  the project directory.
     * 
     * @return {Promise} A Promise. When there are no errors thrown, it will pass NO 
     *  data to the .then() callback.
     *  When an error is thrown, it will pass the error to the catch() callback.
     */
    clearFolder(){
        return new Promise((resolve, reject) => {
            fs.readdir(DOWNLOADS_DIRECTORY, (error, files) => {
                if (error)
                    reject(error);
                
                files.forEach(file => {
                    var dirPath = path.join(DOWNLOADS_DIRECTORY, file);
                    fs.unlink(dirPath, error => {
                        if (error)
                            reject(error);
                    });
                });
                resolve();
            });
        });
    }

    /**
     * Downloads the GTFS static files and extracts them to DOWNLOADS_DIRECTORY
     * Pre-condition: The folder "DOWNLOADS_DIRECTORY" must be present which is
     *  relative to the project directory
     * 
     * @param {string} url The URL to the ZIP files containing the GTFS static files.
     * @return {Promise} A Promise. When there are no errors thrown, 
     *  it will not pass any values to the .then() callback.
     *  If there are any errors thrown, it will pass the error object to the .catch() 
     *  callback.
     */
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
                    zip.extractAllToAsync(DOWNLOADS_DIRECTORY, true, error => {
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

    /**
     * Parses shapes.txt, adds the locations that make up the paths in 
     * the LocationBag "pathLocationBag", and returns a list of paths.
     * 
     * Pre-condition: DOWNLOADS_DIRECTORY/shapes.txt must be present 
     *  relative to the project directory!
     * 
     * @param {LocationBag} pathLocationBag A location bag that will 
     *  be added with GPS locations that make up the paths.
     * 
     * @return {Promise} A Promise object. If no error is thrown, it 
     *  will pass the list of paths parsed to the .then() method. 
     *  If any errors were thrown, it will pass the error object to 
     *  the .catch() method.
     */
    _getPaths(pathLocationBag){
        return new Promise((resolve, reject) => {
            var locationIDToSequence = {};
            var pathIDToPathDetails = {};

            var fileStream = fs.createReadStream("tmp/extracted-gtfs-static-files/shapes.txt");
            CSV.fromStream(fileStream, { headers: true })
                .on("data", shape => {
                    var pathID = shape.shape_id;

                    if (pathIDToPathDetails[pathID] == undefined){
                        pathIDToPathDetails[pathID] = new Path();
                    }

                    // Add the location to the LocationMap and keep track of its order
                    var newPathLocation = new Location(shape.shape_pt_lat, shape.shape_pt_lon);
                    var locationID = pathLocationBag.addLocation(newPathLocation);
                    locationIDToSequence[locationID] = shape.shape_pt_sequence;

                    pathIDToPathDetails[pathID].addPoint(locationID, newPathLocation);
                })
                .on("error", error => {
                    reject(error);
                })
                .on("end", () => {
                    
                    // Sort the points in each path by their sequence
                    Object.keys(pathIDToPathDetails).forEach(pathID => {
                        pathIDToPathDetails[pathID].points.sort((a, b) => {

                            // Note that "a" and "b" are location IDs
                            var aOrder = locationIDToSequence[a];
                            var bOrder = locationIDToSequence[b];

                            if (aOrder < bOrder){
                                return -1;
                            }
                            else {
                                return 1;
                            }
                        })
                    });

                    // Adding the _id properties to each value in pathIDToPathDetails{}
                    Object.keys(pathIDToPathDetails).forEach(pathID => {
                        pathIDToPathDetails[pathID]._id = pathID;
                    });

                    // Convert the pathIDToPathDetails{} to a list
                    var pathsList = [];
                    Object.keys(pathIDToPathDetails).forEach(pathID => {
                        pathsList.push(pathIDToPathDetails[pathID]);
                    });

                    resolve(pathsList);
                });
        });
    }

    /**
     * Saves the contents in the LocationBag to the database
     * "dbo" in the collection "collectionName"
     * where each entry in the database is:
     * {
     *      _id: <locationID>,
     *      latitude: <latitude>
     *      longitude: <longitude>
     * }
     * 
     * @param {Db} dbo A MongoDB database
     * @param {string} collectionName A collection name
     * @param {LocationBag} locationBag A location bag instance
     * @return {Promise} A promise object.
     *  If no errors are thrown, it will pass nothing to the .then() method.
     *  If an error is thrown, it will pass the error to the .catch() method.
     */
    saveLocationBagToDatabase(dbo, collectionName, locationBag){
        return new Promise((resolve, reject) => {
            /**
             * Convert the LocationBag to a simple list where each entry is
             * {
             *      _id: <locationID>,
             *      latitude: <latitude>
             *      longitude: <longitude>
             * }
             */
            var pathLocationsToBeSaved = [];
            Object.keys(locationBag.getStoredLocations()).forEach(locationID => {
                var locationObj = locationBag.getLocation(locationID);

                var locationDataToSave = {
                    _id: locationID,
                    latitude: locationObj.latitude,
                    longitude: locationObj.longitude
                };
                pathLocationsToBeSaved.push(locationDataToSave);
            });

            // Store pathLocationsToBeSaved[] in the database
            dbo.collection(collectionName).insertMany(pathLocationsToBeSaved, (error, response) => {
                if (error)
                    reject(error);

                console.log("Finished saving path locations!");
                resolve();
            });
        });
    }

    /**
     * Stores the "paths" in the database "dbo" in the collection "collectionName"
     * 
     * Pre-condition: "paths" must be an array of path objects.
     * 
     * @param {Db} dbo A MongoDB database
     * @param {string} collectionName A collection name to store paths[] in "Db"
     * @param {Array} paths A list of paths 
     * @return {Promise} A promise. 
     *  If no error is thrown, it will pass nothing to the .then() method. 
     *  If an error is thrown, it will pass the error to the .catch() method.
     */
    savePathsToDatabase(dbo, collectionName, paths){
        return new Promise((resolve, reject) => {
            dbo.createCollection("paths", async (error, response) => {
                if (error)
                    reject(error);

                dbo.collection(collectionName).insertMany(paths, (error, response) => {
                    if (error)
                        reject(error);

                    resolve();
                });
            });
        });
    }

    /**
     * Parses and returns the data stored in the routes.txt CSV file.
     * 
     * Pre-condition: DOWNLOADS_DIRECTORY/routes.txt must be present
     *  relative to the project directory
     * 
     * @return {Promise} A Promise object.
     *  When no errors are thrown,it will pass a map of route IDs to the 
     *  route details to the .then() method. 
     *  When an error is thrown, it will pass the error to the .catch() method.
     */
    _getRoutes(){
        return new Promise((resolve, reject) => {

            // Get and store the routes in a Map.
            // The keys are the routeIDs while the values are route data.
            var routeIDToRouteDetails = {};

            // Read the routes from the CSV file
            var fileStream = fs.createReadStream("tmp/extracted-gtfs-static-files/routes.txt");
            CSV.fromStream(fileStream, { headers: true } )
                .on("data", rawRouteData => {
                    var routeID = rawRouteData.route_id;

                    routeIDToRouteDetails[routeID] = {
                        shortName: rawRouteData.route_short_name,
                        longName: rawRouteData.route_long_name,
                        type: rawRouteData.route_type
                    };
                })
                .on("error", error => {
                    reject(error);
                })
                .on("end", () => {
                    console.log("Finished getting routes!");
                    resolve(routeIDToRouteDetails);
                });
        });
    }

    /**
     * Parses and compresses the contents in trips.txt and "routeIDToRouteDetails"
     * to one data structure in a list.
     * 
     * Pre-condition:  
     *  DOWNLOADS_DIRECTORY/trips.txt and DOWNLOADS_DIRECTORY/routes.txt must be present
     *  relative to the project directory
     * 
     * @param {Map} routeIDToRouteDetails A map that maps route IDs to route details
     * @return {Promise} A promise object.
     *  If no error is thrown, it will pass a list of trips to the .then() method.
     *  If an error is thrown, it will pass the error to the .catch() method.
     */
    _getTrips(routeIDToRouteDetails){
        return new Promise(async (resolve, reject) => {
            try{
                var trips = [];
                var fileStream = fs.createReadStream("tmp/extracted-gtfs-static-files/trips.txt");
                CSV.fromStream(fileStream, { headers: true } )
                    .on("data", rawTripData => {
                        var tripID = rawTripData.trip_id;
                        var shapeID = rawTripData.shape_id;
                        var routeID = rawTripData.route_id;
                        var routeDetails = routeIDToRouteDetails[routeID];
                        var headSign = rawTripData.trip_headsign;

                        var trip = {
                            _id: tripID,
                            pathID: shapeID,
                            shortName: routeDetails.shortName,
                            longName: routeDetails.longName,
                            headSign: headSign
                        };
                        trips.push(trip);         
                    })
                    .on("error", error => {
                        reject(error);
                    })
                    .on("end", () => {
                        resolve(trips);
                    });
            }
            catch(error){
                reject(error);
            }
        });
    }

    /**
     * Stores a list of trips ("trips") to a database ("dbo") in a collection 
     * named "collectionName"
     * 
     * Pre-condition:  
     * - DOWNLOADS_DIRECTORY/trips.txt and DOWNLOADS_DIRECTORY/routes.txt must be present
     *   relative to the project directory
     * - "trips" must be a list. 
     * 
     * @param {db} dbo The Mongo Database instance
     * @param {string} collectionName A collection name 
     * @param {Array} trips A list of trips
     * @return {Promise} A promise.
     *  If no errors are thrown, it will pass nothing to the .then() method.
     *  If an error is thrown, it will pass the error to the .catch() method.
     */
    saveTripsToDatabase(dbo, collectionName, trips){
        return new Promise(async (resolve, reject) => {
            dbo.createCollection(collectionName, async (error, response) => {
                if (error)
                    reject(error);

                try{
                    console.log("Saving " + trips.length + " routes!");
                    dbo.collection(collectionName).insertMany(trips, (error, response) => {
                        if (error)
                            reject(error);

                        console.log("Done saving routes!");
                        resolve();
                    });
                }
                catch(error){
                    reject(error);
                }                
            });
        });
    }

    saveFilesToDatabase(){
        return new Promise((resolve, reject) => {
            MongoClient.connect(MONGODB_URL, async (error, db) => {
                if (error)
                    reject(error);

                try{
                    db = await MongoClient.connect(MONGODB_URL);
                    var dbo = db.db(DATABASE_NAME);

                    // Save the trips and the route details in the database
                    var routeIDToRouteDetails = await this._getRoutes();
                    var trips = await this._getTrips(routeIDToRouteDetails);
                    await this.saveTripsToDatabase(dbo, "trips", trips);

                    console.log("Finished saving routes and trips to database!");

                    // Save the paths and its locations to the database
                    var pathsLocationBag = new LocationBag();
                    var paths = await this._getPaths(pathsLocationBag);
                    await this.savePathsToDatabase(dbo, "paths", paths);
                    await this.saveLocationBagToDatabase(dbo, "pathLocations", pathsLocationBag);

                    resolve();    
                }
                catch (error){
                    reject(error);
                }
            });
        });
    }
}

module.exports = DataCollector;
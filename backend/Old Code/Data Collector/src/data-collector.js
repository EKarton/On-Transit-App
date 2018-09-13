"use strict";

const CSV = require("fast-csv");
const fs = require("fs");
const path = require("path");
const request = require("request");
const AdmZip = require('adm-zip');

const Database = require("./database");
const LocationBag = require("./location-bag");
const Location = require("./location");
const Path = require("./path");

const DOWNLOADS_DIRECTORY = "tmp/extracted-gtfs-static-files";

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

    _getPathLocationIndexClosestToStopLocation(stopLocationID, tripID, database){ 
        return new Promise(async (resolve, reject) => {
            try{      
                var stopLocation = await database.getObject("stopLocations", { "_id": stopLocationID });
                
                var trip = await database.getObject("trips", { "_id": tripID });
                var pathID = trip.pathID;
                var path = await database.getObject("paths", { "_id": pathID });
                var pathLocationIDs = path.points;
    
                var minDistance = 100000000;
                var minPointIndex = -1;
                for (let i = 0; i < pathLocationIDs.length; i++){
                    let pathLocationID = pathLocationIDs[i];
                    let pathLocation = await database.getObject("pathLocations", { "_id": pathLocationID });
                    let distance = Math.pow(pathLocation.latitude - stopLocation.latitude, 2) + 
                        Math.pow(pathLocation.longitude - stopLocation.longitude, 2);
    
                    if (distance < minDistance){
                        minDistance = distance;
                        minPointIndex = i;
                    }
                }
    
                resolve(minPointIndex);
            }
            catch(error){
                console.log(error);
                reject(error);
            }
        });
    }

    _getStopLocations(){
        return new Promise((resolve, reject) => {
            var stopLocationIDToStopLocation = {};
            var fileStream = fs.createReadStream("tmp/extracted-gtfs-static-files/stops.txt");
            CSV.fromStream(fileStream, { headers: true })
                .on("data", rawStopLocationData => {
                    var stopID = rawStopLocationData.stop_id;
                    var stopName = rawStopLocationData.stop_name;
                    var latitude = parseFloat(rawStopLocationData.stop_lat.trim());
                    var longitude = parseFloat(rawStopLocationData.stop_lon.trim());

                    stopLocationIDToStopLocation[stopID] = {
                        _id: stopID,
                        name: stopName,
                        latitude: latitude,
                        longitude: longitude
                    };
                })
                .on("end", () => {
                    var stopLocations = [];
                    Object.keys(stopLocationIDToStopLocation).forEach(stopLocationID => {
                        var stopLocation = stopLocationIDToStopLocation[stopLocationID];
                        stopLocations.push(stopLocation);
                    });
                    resolve(stopLocations);
                })
                .on("error", error => {
                    reject(error);
                });
        });
    }

    _convertTimeToInteger(time){
        var splittedTime = time.split(":");
        var numHrsFromNoon = parseInt(splittedTime[0]);
        var numMinFromHr = parseInt(splittedTime[1]);
        var numSecFromMin = parseInt(splittedTime[2]);
        return numSecFromMin + (numMinFromHr * 60) + (numHrsFromNoon * 3600);
    }

    _getStops(database){
        return new Promise((resolve, reject) => {

            var tripIDToStops = {};

            // tripID + stopID (concatenated) maps to the stop sequence for that stop.
            var stopIDToStopSequence = {};

            var fileStream = fs.createReadStream("tmp/extracted-gtfs-static-files/stop_times.txt");
            CSV.fromStream(fileStream, { headers: true })
                .on("data", async rawStopTimeData => {
                    var tripID = rawStopTimeData.trip_id;
                    var arrivalTime = rawStopTimeData.arrival_time;
                    var departureTime = rawStopTimeData.departure_time;
                    var stopLocationID = rawStopTimeData.stop_id;
                    var stopSequence = parseInt(rawStopTimeData.stop_sequence);

                    // Convert the time from HH:MM:SS to HHMMSS
                    var arrivalTime_Converted = this._convertTimeToInteger(arrivalTime);
                    var departTime_Converted = this._convertTimeToInteger(departureTime);

                    if (tripIDToStops[tripID] === undefined){
                        tripIDToStops[tripID] = {
                            _id: tripID,
                            numStops: 0,
                            startTime: 100000000,
                            endTime: -100000000,
                            stops: []
                        };
                    }

                    if (arrivalTime_Converted < tripIDToStops[tripID].startTime){
                        tripIDToStops[tripID].startTime = arrivalTime_Converted;
                    }

                    if (departTime_Converted > tripIDToStops[tripID].endTime){
                        tripIDToStops[tripID].endTime = departTime_Converted;
                    }

                    //var closestPathLocationID = await this._getPathLocationIndexClosestToStopLocation(stopLocationID, tripID, database);
                    //console.log("closestPathLocationID", closestPathLocationID);

                    tripIDToStops[tripID].numStops ++;
                    tripIDToStops[tripID].stops.push({
                        arrivalTime: arrivalTime_Converted,
                        departureTime: departTime_Converted,
                        stopLocationID: stopLocationID
                        //closestPathLocationID: closestPathLocationID
                    });

                    var tripIDAndStopIDKey = tripID + "_" + stopLocationID;
                    stopIDToStopSequence[tripIDAndStopIDKey] = stopSequence;
                })
                .on("end", () => {

                    // Sort the stops by stop sequence
                    Object.keys(tripIDToStops).forEach(tripID => {
                        var stops = tripIDToStops[tripID].stops;
                        stops.sort((a, b) => {
                            var stopID_A = tripID + "_" + a.stopLocationID;
                            var stopID_B = tripID + "_" + b.stopLocationID;
                            var stopOrder_A = stopIDToStopSequence[stopID_A];
                            var stopOrder_B = stopIDToStopSequence[stopID_B];

                            if (stopOrder_A < stopOrder_B)
                                return -1;
                            else
                                return 1;
                        });
                    });

                    // Convert tripIDToStops{} to a list of stops
                    var stops = [];
                    Object.keys(tripIDToStops).forEach(curTripID => {
                        var stopsObject = tripIDToStops[curTripID];
                        stops.push(stopsObject);
                    });

                    resolve(stops);
                })
                .on("error", error => {
                    reject(error); 
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
                    var pathLocationSequence = parseFloat(shape.shape_pt_sequence.trim());

                    if (pathIDToPathDetails[pathID] == undefined){
                        pathIDToPathDetails[pathID] = new Path();
                    }

                    // Add the location to the LocationMap and keep track of its order
                    var latitude = parseFloat(shape.shape_pt_lat.trim());
                    var longitude = parseFloat(shape.shape_pt_lon.trim());
                    var newPathLocation = new Location(latitude, longitude);

                    var locationID = pathLocationBag.addLocation(newPathLocation);
                    locationIDToSequence[locationID] = pathLocationSequence;

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

    saveLocationBagToDatabase(database, collectionName, locationBag){
        return new Promise(async (resolve, reject) => {
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

            try{
                await database.saveArrayToDatabase(collectionName, pathLocationsToBeSaved);
                resolve();
            }
            catch(error){
                reject(error);
            }
        });
    }

    saveFilesToDatabase(database){
        return new Promise(async (resolve, reject) => {
            try{
                // Create the collections
                await database.createCollectionInDatabase("pathLocations");
                await database.createCollectionInDatabase("paths");
                await database.createCollectionInDatabase("stopLocations");
                await database.createCollectionInDatabase("stops");
                await database.createCollectionInDatabase("trips");

                // Get the trips and save it in the database
                var routeIDToRouteDetails = await this._getRoutes();
                var trips = await this._getTrips(routeIDToRouteDetails);
                await database.saveArrayToDatabase("trips", trips);

                console.log("Successfully saved trips to database");

                // Get paths and path locations and save it to the database
                var pathsLocationBag = new LocationBag();
                var paths = await this._getPaths(pathsLocationBag);
                await database.saveArrayToDatabase("paths", paths);
                await this.saveLocationBagToDatabase(database, "pathLocations", pathsLocationBag);

                console.log("Successfully saved paths and path locations to database");

                // Get the stop and stop locations and save it to te database
                var stopLocations = await this._getStopLocations();
                await database.saveArrayToDatabase("stopLocations", stopLocations);
                console.log("Successfully saved stop locations to database");

                var stops = await this._getStops(database);
                await database.saveArrayToDatabase("stops", stops);
                console.log("Successfully saved trip stops to database");

                await database.closeDatabase();
                console.log("Successfully shut down database connection");
                resolve();
            }
            catch(error){
                if (database != null)
                    await database.closeDatabase();
                reject(error);
            }
        });
    }
}

module.exports = DataCollector;
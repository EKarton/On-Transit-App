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
class DataCollectorV2{

    /**
     * Clears any files in the <DOWNLOADS_DIRECTORY>.
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
     * It will parse the locations, grab those that are common, and 
     * @param {Db} dbo The database 
     */
    savePathsToDatabase(dbo){
        return new Promise((resolve, reject) => {

            dbo.createCollection("paths", (error, response) => {
                if (error)
                    reject(error);
                var pathLocationBag = new LocationBag();
                var paths = {};
    
                var fileStream = fs.createReadStream("tmp/extracted-gtfs-static-files/shapes.txt");
                CSV.fromStream(fileStream, { headers: true })
                    .on("data", shape => {
                        var shapeID = shape.shape_id;
    
                        if (paths[shapeID] == undefined){
                            paths[shapeID] = new Path();
                        }
    
                        var newPathLocation = new Location(shape.shape_pt_lat, shape.shape_pt_lon);
                        var locationID = pathLocationBag.addLocation(newPathLocation);
    
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

                        var pathsList = [];
                        Object.keys(paths).forEach(shapeID => {
                            paths[shapeID]._id = shapeID;

                            var pathLocationIDList = [];
                            for (let i = 0; i < paths[shapeID].points.length; i++){
                                pathLocationIDList.push(paths[shapeID].points[i].locationID);
                            }
                            paths[shapeID].points = pathLocationIDList;

                            pathsList.push(paths[shapeID]);
                        });
    
                        // Save the paths
                        dbo.collection("paths").insertMany(pathsList, (error, response) => {
                            if (error)
                                reject(error);
                            console.log("Finished saving paths! " + response.insertedCount);

                            dbo.createCollection("pathLocations", (error, response) => {
                                if (error)
                                    reject(error);

                                console.log("Created pathLocations collection!");

                                var pathLocationsToBeSaved = [];
                                Object.keys(pathLocationBag.getStoredLocations()).forEach(locationID => {
                                    var locationObj = pathLocationBag.getLocation(locationID);
                                    var locationDataToSave = {
                                        _id: locationID,
                                        latitude: locationObj.latitude,
                                        longitude: locationObj.longitude
                                    };
                                    pathLocationsToBeSaved.push(locationDataToSave);
                                });

                                dbo.collection("pathLocations").insertMany(pathLocationsToBeSaved, (error, response) => {
                                    if (error)
                                        reject(error);

                                    console.log("Finished saving path locations!");
                                    resolve();
                                });
                            });
                        });
                    });
            });
        });
    }

    /**
     * Parses and returns the data stored in the routes.txt CSV file.
     * Pre-condition: DOWNLOADS_DIRECTORY/routes.txt must be present
     *  relative to the project directory
     * 
     * @return {Promise} A Promise. When successful, it will return a 
     *  map of route IDs (as keys) to the route details (as values).
     *  When an error is thrown, it will reject(error)
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
     * Parses and aggregates the contents in trips.txt and routes.txt to one data structure
     * Pre-condition:  
     *  DOWNLOADS_DIRECTORY/trips.txt and DOWNLOADS_DIRECTORY/routes.txt must be present
     *  relative to the project directory
     * 
     * @return {Promise} Returns a Promise. 
     *  When successful, it returns teh aggregated data; 
     *  else it returns the Error object that the error has thrown.
     */
    _getTrips(){
        return new Promise(async (resolve, reject) => {
            try{
                var routeIDToRouteDetails = await this._getRoutes();

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
     * Parses, aggregates, and stores the content in trips.txt and routes.txt
     * in a collection name "trips".
     * Pre-condition:  
     *  DOWNLOADS_DIRECTORY/trips.txt and DOWNLOADS_DIRECTORY/routes.txt must be present
     *  relative to the project directory
     * 
     * @param {db} dbo The Mongo Database instance 
     * @return {Promise} A promise. When successful, it does not return any data back. 
     *  If an error was thrown, it will pass the Error object in the reject()
     */
    saveTripsToDatabase(dbo){
        return new Promise(async (resolve, reject) => {
            dbo.createCollection("trips", async (error, response) => {
                if (error)
                    reject(error);

                try{
                    var trips = await this._getTrips();

                    console.log("Saving " + trips.length + " routes!");
                    dbo.collection("trips").insertMany(trips, (error, response) => {
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
                    // await this.saveRoutesToDatabase(dbo);
                    await this.saveTripsToDatabase(dbo);
                    console.log("Finished saving routes and trips to database!");
                    await this.savePathsToDatabase(dbo);
                    resolve();    
                }
                catch (error){
                    reject(error);
                }
            });
        });
    }
}

module.exports = DataCollectorV2;
"use strict";

const CSV = require("fast-csv");
const fs = require("fs");
const path = require("path");
const request = require("request");
const AdmZip = require('adm-zip');

class RawDataCollector{
    constructor(database, downloadFolder){
        this.database = database;
        this.downloadFolder = downloadFolder;
    }

    _convertTimeToInteger(time){
        var splittedTime = time.split(":");
        var numHrsFromNoon = parseInt(splittedTime[0]);
        var numMinFromHr = parseInt(splittedTime[1]);
        var numSecFromMin = parseInt(splittedTime[2]);
        return numSecFromMin + (numMinFromHr * 60) + (numHrsFromNoon * 3600);
    }

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
            fs.readdir(this.downloadFolder, (error, files) => {
                if (error){
                    reject(error);
                }

                if (files){              
                    files.forEach(file => {
                        var dirPath = path.join(this.downloadFolder, file);
                        fs.unlink(dirPath, error => {
                            if (error)
                                reject(error);
                        });
                    });
                }
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
        return new Promise((resolve, reject) => {
            var requestSettings = {
                method: 'GET',
                url: url,
                encoding: null
            };

            // Download the Zip file
            request(requestSettings)
                .on("error", error => {
                    console.log("ERROR! " + error);
                    reject(error);
                })
                .pipe(fs.createWriteStream(this.downloadFolder + "/master.zip"))
                .on("finish", () => {
                    
                    // Extract the ZIP file
                    console.log("Finished downloading");
                    var zip = new AdmZip(this.downloadFolder + "/master.zip");
                    zip.extractAllToAsync(this.downloadFolder, true, error => {
                        if (error){
                            reject(error);
                        }
                        else{
                            console.log("Finished downloading raw GTFS files in ZIP file!");
                            resolve();
                        }
                    });
                });
        });
    }

    saveTripsToDatabase(){
        return new Promise((resolve, reject) => {
            var fileStream = fs.createReadStream(this.downloadFolder + "/trips.txt");
            CSV.fromStream(fileStream, { headers: true } )
                .on("data", async rawTripData => {
                    var tripID = rawTripData.trip_id.trim();
                    var shapeID = rawTripData.shape_id.trim();
                    var routeID = rawTripData.route_id.trim();
                    var headSign = rawTripData.trip_headsign.trim();
                    var tripShortName = rawTripData.trip_short_name.trim();
                    
                    var databaseObject = {
                        tripID: tripID,
                        shapeID: shapeID,
                        routeID: routeID,
                        headSign: headSign,
                        tripShortName: tripShortName
                    }

                    await this.database.saveObjectToDatabase("raw-trips", databaseObject);
                })
                .on("error", error => {
                    reject(error);
                })
                .on("end", () => {
                    resolve();
                });
        });
    }

    saveRoutesToDatabase(){
        return new Promise((resolve, reject) => {
            var fileStream = fs.createReadStream(this.downloadFolder + "/routes.txt");
            CSV.fromStream(fileStream, { headers: true } )
                .on("data", async rawRouteData => {
                    var routeID = rawRouteData.route_id;
                    var shortName = rawRouteData.route_short_name;
                    var longName = rawRouteData.route_long_name;
                    var type = rawRouteData.route_type;

                    var databaseObject = {
                        routeID: routeID,
                        shortName: shortName,
                        longName: longName,
                        type: type 
                    };

                    await this.database.saveObjectToDatabase("raw-routes", databaseObject);
                })
                .on("error", error => {
                    reject(error);
                })
                .on("end", () => {
                    console.log("Finished saving routes to database!");
                    resolve();
                });
        });
    }

    saveShapesToDatabase(){
        return new Promise((resolve, reject) => {
            var fileStream = fs.createReadStream(this.downloadFolder + "/shapes.txt");
            CSV.fromStream(fileStream, { headers: true } )
                .on("data", async rawShapeData => {
                    var shapeID = rawShapeData.shape_id;
                    var latitude = parseFloat(rawShapeData.shape_pt_lat.trim());
                    var longitude = parseFloat(rawShapeData.shape_pt_lon.trim());
                    var sequence = parseInt(rawShapeData.shape_pt_sequence.trim());

                    var databaseObject = {
                        shapeID: shapeID,
                        latitude: latitude,
                        longitude: longitude,
                        sequence: sequence
                    };

                    await this.database.saveObjectToDatabase("raw-shapes", databaseObject);
                })
                .on("error", error => {
                    reject(error);
                })
                .on("end", () => {
                    console.log("Finished saving raw shapes data to database!");
                    resolve();
                });
        });
    }

    saveStopLocationsToDatabase(){
        return new Promise((resolve, reject) => {
            var fileStream = fs.createReadStream(this.downloadFolder + "/stops.txt");
            CSV.fromStream(fileStream, { headers: true } )
                .on("data", async rawStopLocation => {
                    var stopLocationID = rawStopLocation.stop_id.trim();
                    var name = rawStopLocation.stop_name.trim();
                    var description = rawStopLocation.stop_desc.trim();
                    var latitude = parseFloat(rawStopLocation.stop_lat.trim());
                    var longitude = parseFloat(rawStopLocation.stop_lon.trim());

                    var databaseObject = {
                        stopLocationID: stopLocationID,
                        name: name,
                        description: description,
                        latitude: latitude,
                        longitude: longitude
                    };

                    await this.database.saveObjectToDatabase("raw-stop-locations", databaseObject);
                })
                .on("error", error => {
                    reject(error);
                })
                .on("end", () => {
                    console.log("Finished saving raw stop locations to database!");
                    resolve();
                });
        });
    }

    saveStopTimesToDatabase(){
        return new Promise((resolve, reject) => {
            var fileStream = fs.createReadStream(this.downloadFolder + "/stop_times.txt");
            CSV.fromStream(fileStream, { headers: true } )
                .on("data", async rawStopTimesData => {
                    var tripID = rawStopTimesData.trip_id.trim();
                    var stopLocationID = rawStopTimesData.stop_id.trim();
                    var arrivalTime = rawStopTimesData.arrival_time;
                    var departTime = rawStopTimesData.departure_time;
                    var sequence = parseInt(rawStopTimesData.stop_sequence.trim());
                    var headsign = rawStopTimesData.stop_headsign.trim();

                    var convertedArrivalTime = this._convertTimeToInteger(arrivalTime);
                    var convertedDepartTime = this._convertTimeToInteger(departTime);

                    var databaseObject = {
                        tripID: tripID,
                        stopLocationID: stopLocationID,
                        arrivalTime: convertedArrivalTime,
                        departTime: convertedDepartTime,
                        sequence: sequence,
                        headsign: headsign
                    };

                    await this.database.saveObjectToDatabase("raw-stop-times", databaseObject);
                })
                .on("error", error => {
                    reject(error);
                })
                .on("end", () => {
                    console.log("Finished saving stop times to database!");
                    resolve();
                });
        });
    }
}

module.exports = RawDataCollector;
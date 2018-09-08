"use strict";

const Database = require("./common/database");
const LocationBag = require("./location-bag");
const Location = require("./location");

class PathAggregator{

    /**
     * Initializes the aggregator with two data sources
     * @param {Database} rawDatabase 
     * @param {Database} cleanDatabase 
     * @param {LocationBag} locationBag
     */
    constructor(rawDatabase, cleanDatabase, locationBag){
        this.rawDatabase = rawDatabase;
        this.cleanDatabase = cleanDatabase;
        this.locationBag = locationBag;
    }

    _sortPathLocations(pathLocations){
        pathLocations.sort(async (a, b) => {
            var aOrder = a.sequence;
            var bOrder = b.sequence;

            if (aOrder < bOrder){
                return -1;
            }
            else {
                return 1;
            }
        });
    }

    _sortPathLocationsInAllPaths(){
        return new Promise(async (resolve, reject) => {
            try{
                var cursor = await this.cleanDatabase.getObjects("paths", {});
                while (await cursor.hasNext()){
                    var pathData = await cursor.next();
                    var pathID = pathData._id;
                    var pathLocations = pathData.pathLocations;
                    this._sortPathLocations(pathLocations);

                    // Update the data
                    var newValues = {
                        $set: {
                            pathLocations: pathLocations
                        } 
                    };
                    
                    await this.cleanDatabase.updateObject("paths", { "_id": pathID }, newValues);
                }
                resolve();
            }
            catch(error){
                reject(error);
            }
        });
    }

    processData(){
        return new Promise(async (resolve, reject) => {
            try{
                var cursor = await this.rawDatabase.getObjects("raw-shapes", {});
                while (await cursor.hasNext()){
                    var rawShapesData = await cursor.next();

                    // Get the path location details
                    var pathID = rawShapesData.shapeID;
                    var latitude = rawShapesData.latitude;
                    var longitude = rawShapesData.longitude;
                    var sequence = rawShapesData.sequence;

                    // Add the path location to the database
                    var pathLocation = new Location(latitude, longitude);
                    var pathLocationID = await this.locationBag.addLocation(pathLocation);

                    var orderedPathLocationEntry = {
                        pathLocationID: pathLocationID,
                        sequence: sequence
                    };

                    // Add the path info to the database (if it doesnt exist yet)
                    var pathDetails = await this.cleanDatabase.getObject("paths", { "_id": pathID });
                    if (pathDetails == null){
                        var pathDbObject = {
                            _id: pathID,
                            minLatitude: latitude,
                            maxLatitude: latitude,
                            minLongitude: longitude,
                            maxLongitude: longitude,
                            pathLocations: [orderedPathLocationEntry]
                        };
                        await this.cleanDatabase.saveObjectToDatabase("paths", pathDbObject);
                    }
                    else{
                        // Update the data to include the new point
                        var newMinLatitude = Math.min(pathDetails.minLatitude, pathLocation.latitude);
                        var newMaxLatitude = Math.min(pathDetails.maxLatitude, pathLocation.latitude);
                        var newMinLongitude = Math.min(pathDetails.minLongitude, pathLocation.latitude);
                        var newMaxLongitude = Math.min(pathDetails.maxLongitude, pathLocation.latitude);

                        var existingPathLocations = pathDetails.pathLocations;
                        existingPathLocations.push(orderedPathLocationEntry);

                        var newValues = {
                            $set: {
                                minLatitude: newMinLatitude,
                                maxLatitude: newMaxLatitude,
                                minLongitude: newMinLongitude,
                                maxLongitude: newMaxLongitude,
                                pathLocations: existingPathLocations
                            } 
                        };
                        
                        await this.cleanDatabase.updateObject("paths", { "_id": pathID }, newValues);
                    }
                }

                // Sort the path locations in each path by their sequence
                await this._sortPathLocationsInAllPaths();
                
                resolve();
            }
            catch(error){
                reject(error);
            }
        });
    }
}

module.exports = PathAggregator;
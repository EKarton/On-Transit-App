const Vector = require("./vector");
const Geography = require("./geography");
const Circle = require("./circle");
const BoundingBox = require("./bounding-box");

class PathsLocator{
    constructor(database){
        this.database = database;
        this.amount = 0;
    }

    getPathLocation(pathLocationID){
        return new Promise(async (resolve, reject) => {
            this.database.getObject("pathLocations", { "_id": pathLocationID })
                .then(rawPathLocation => {
                    var latitude = rawPathLocation.latitude;
                    var longitude = rawPathLocation.longitude;
                    var pathLocation = new Vector(longitude, latitude);

                    resolve(pathLocation);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    async arePathLocationsInGeofence(pathLocationIDs, geofence, geofenceBoundingBox){
        var arePathLocationsInGeofence = false;

        // Get the endpoints of the path
        var lastPathLocIndex = pathLocationIDs.length - 1;
        var firstPathLoc = await this.getPathLocation(pathLocationIDs[0]);
        var lastPathLoc = await this.getPathLocation(pathLocationIDs[lastPathLocIndex]);

        // Test if the endpoints of the path are in the geofence
        if (Geography.calculateDistance(firstPathLoc, geofence.centerPt) <= geofence.radius){
            arePathLocationsInGeofence = true;
        }
        else if (Geography.calculateDistance(lastPathLoc, geofence.centerPt) <= geofence.radius){
            arePathLocationsInGeofence = true;
        }

        // Test if the internal points in the path are in the geofence
        else{
            for (let i = 1; i < pathLocationIDs.length; i++){
                var pathLocID_1 = pathLocationIDs[i - 1];
                var pathLocID_2 = pathLocationIDs[i];
                
                var pathLoc_1 = await this.getPathLocation(pathLocID_1);
                var pathLoc_2 = await this.getPathLocation(pathLocID_2);

                var pathSegmentBoundingBox = new BoundingBox(
                    Math.min(pathLoc_1.x, pathLoc_2.x),
                    Math.max(pathLoc_1.x, pathLoc_2.x),
                    Math.min(pathLoc_1.y, pathLoc_2.y),
                    Math.max(pathLoc_1.y, pathLoc_2.y)
                );

                if (pathSegmentBoundingBox.isIntersectWith(geofenceBoundingBox)){
                    if (Geography.isStraightPathInGeofence(pathLoc_1, pathLoc_2, geofence)){
                        arePathLocationsInGeofence = true;
                        break;
                    }
                }
            }
        }
        this.amount++;
        return arePathLocationsInGeofence;
    }

    async isPathInGeofence(path, geofence, geofenceBoundingBox){
        // Create a bounding box for the entire path
        var minLatitude = path.minLatitude;
        var maxLatitude = path.maxLatitude;
        var minLongitude = path.minLongitude;
        var maxLongitude = path.maxLongitude;
        var pathBoundingBox = new BoundingBox(minLongitude, maxLongitude, minLatitude, maxLatitude);

        // Optimization: terminate when bounding box is not touching
        if (!pathBoundingBox.isIntersectWith(geofenceBoundingBox)){
            return false;
        }

        var pathLocationIDs = path.points;
        var isPathInGeofence = await this.arePathLocationsInGeofence(pathLocationIDs, geofence, geofenceBoundingBox);       

        return isPathInGeofence;
    }

    async getPathIDsInGeofence(geofence){        
        // Get the bounding box of the circular geofence
        var geofenceBoundingBox = Geography.getBoundingBoxOfGeofence(geofence);  

        var pathIDs = [];

        var cursor = this.database.getObjects("paths", {});
        while(await cursor.hasNext()){
            var rawPathData = await cursor.next(); 
            var pathID = rawPathData._id;
            var isValid = await this.isPathInGeofence(rawPathData, geofence, geofenceBoundingBox);
            if (isValid){
                pathIDs.push(pathID);
            }
        }
        await cursor.close();
        return pathIDs;
    }

    async getPathIDsNearLocation(latitude, longitude, radius){
        var centerPt = new Vector(longitude, latitude);
        var geofence = new Circle(centerPt, radius);
        var pathIDs = await this.getPathIDsInGeofence(geofence);

        return pathIDs;   
    }
}

module.exports = PathsLocator;
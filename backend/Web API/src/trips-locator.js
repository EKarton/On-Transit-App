const PathsLocator = require("./paths-locator");

class TripsLocator{

    constructor(database){
        this.database = database;
        this.pathsLocator = new PathsLocator(database);
    }

    async getTripIDsNearLocation(latitude, longitude, radius){
        var pathIDs = await this.pathsLocator.getPathIDsNearLocation(latitude, longitude, radius);
        console.log("Done getting path IDs!");

        var tripIDs = [];
        for (let i = 0; i < pathIDs.length; i++){ 
            var pathID = pathIDs[i];
            var cursor = this.database.getObjects("trips", { "pathID": pathID});
            while (await cursor.hasNext()){
                var data = await cursor.next();
                var tripID = data._id;
                tripIDs.push(tripID);
            }
        }
        return tripIDs;
    }
}

module.exports = TripsLocator;
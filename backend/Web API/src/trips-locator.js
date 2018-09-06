const PathsLocator = require("./paths-locator");

class TripsLocator{

    constructor(database){
        this.database = database;
        this.pathsLocator = new PathsLocator(database);
    }

    async getTripIDsNearLocation(latitude, longitude, radius, time){
        var pathIDs = await this.pathsLocator.getPathIDsNearLocation(latitude, longitude, radius);
        console.log("Done getting path IDs!");

        var tripIDs = [];
        for (let i = 0; i < pathIDs.length; i++){ 
            var pathID = pathIDs[i];
            var cursor = this.database.getObjects("trips", { "pathID": pathID});
            while (await cursor.hasNext()){
                var data = await cursor.next();
                var tripID = data._id;

                // Check if it satisfies the time constraints
                var tripStops = await this.database.getObject("stops", { "_id": tripID });
                var startTime = tripStops.startTime;
                var endTime = tripStops.endTime;

                if (startTime <= time && time <= endTime){
                    tripIDs.push(tripID);
                }
            }
        }
        return tripIDs;
    }
}

module.exports = TripsLocator;
const Database = require("on-transit").Database;

class PathBuilder{

    /**
     * Constructs the PathBuilder
     * @param {Database} rawDatabase The old database
     * @param {Database} processedDatabase The new database
     */
    constructor(oldDb, newDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
    }

    async getPath(trip){

        // Collect all the path locations with the same shape ID
        var items = [];
        var shapeID = trip.shapeID;
        var cursor = await this.oldDb.getObjects("raw-shapes", { 
            $query: { "shapeID": shapeID }, $orderby: { sequence: 1 } 
        });
        while (await cursor.hasNext()){
            var shapeData = await cursor.next();
            var item = {
                latitude: shapeData.latitude,
                longitude: shapeData.longitude,
                sequence: shapeData.sequence
            };
            items.push(item);
        }   

        // Sort the data by sequence in ascending order
        items = items.sort((a, b) => {
            var sequenceA = a.sequence;
            var sequenceB = b.sequence;

            if (sequenceA < sequenceB){
                return -1;
            }
            else{
                return 1;
            }
        });

        // Remove the sequence property
        let coordinates = items.map(obj => {
            return [obj.longitude, obj.latitude];
        });

        return coordinates;
    }

    processData(){
        return new Promise(async (resolve, reject) => {
            let rawTripsCursor = this.oldDb.getObjects("raw-trips", {});
            while (await rawTripsCursor.hasNext()){
                let rawTrip = await rawTripsCursor.next();
                let shapeID = rawTrip.shapeID;

                // Skip it if it already has an entry
                let existingTree = await this.newDb.getObject("paths", { "pathID": shapeID });
                if (!existingTree){
                    let coordinates = await this.getPath(rawTrip);
                    let pathLocation = {
                        pathID: rawTrip.shapeID,
                        location: {
                            type: "LineString",
                            coordinates: coordinates
                        }
                    };
            
                    await this.newDb.saveObjectToDatabase("paths", pathLocation);
                }
            }
            resolve();
        });
    }
}

module.exports = PathBuilder;

/**
 * The algorithm:
 * Each time we send a path to the new DB, it will return back the document ID.
 * That document ID will get placed in the mappings DB, where the key is the old 
 * document ID from the old DB, and the value is the new document ID.
 */
class StopLocationsMigrator{
    constructor(oldDb, newDb, mappingsDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
        this.mappingsDb = mappingsDb;
    }

    processData(){
        return new Promise(async (resolve, reject) => {
            let oldStopLocationsCursor = await this.oldDb.getObjects("stop-locations", {});
            while (await oldStopLocationsCursor.hasNext()){
                let oldStopLocation = await oldStopLocationsCursor.next();
                let newStopLocationObj = {
                    name: oldStopLocation.name,
                    description: oldStopLocation.description,
                    latitude: oldStopLocation.latitude,
                    longitude: oldStopLocation.longitude
                };

                let newDocument = await this.newDb.saveObjectToDatabase("stop-locations", newStopLocationObj);
                let newStopLocationID = newDocument.insertedId;

                await this.mappingsDb.saveObjectToDatabase("stop-location-ID-mappings", {
                    oldID: oldStopLocation.stopLocationID,
                    newID: newStopLocationID
                });
            }
            resolve();
        });
    }
}

module.exports = StopLocationsMigrator;

/**
 * It will migrate the paths from the old database to the new database with 
 * a new, unique ID set by the new database.
 * 
 * The algorithm:
 * Each time we send a path to the new DB, it will return back the document ID.
 * That document ID will get placed in the mappings DB, where the key is the old 
 * document ID from the old DB, and the value is the new document ID.
 */
class PathsMigrator{
    constructor(oldDb, newDb, mappingsDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
        this.mappingsDb = mappingsDb;
    }

    /**
     * Migrates the paths from the old DB to the new DB
     * with unique path IDs set by the new DB.
     */
    processData(){
        return new Promise(async (resolve, reject) => {
            let oldPathsCursor = await this.oldDb.getObjects("paths", {});
            while (await oldPathsCursor.hasNext()){
                let oldPathObj = await oldPathsCursor.next();
                let newPathObj = {
                    location: oldPathObj.location
                };

                let newDocument = await this.newDb.saveObjectToDatabase("paths", newPathObj);
                let newPathID = newDocument.insertedId;

                await this.mappingsDb.saveObjectToDatabase("path-ID-mappings", {
                    oldID: oldPathObj.pathID,
                    newID: newPathID
                });
            }
            resolve();
        });
    }
}

module.exports = PathsMigrator;

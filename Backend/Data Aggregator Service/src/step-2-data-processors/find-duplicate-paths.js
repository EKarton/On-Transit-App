const md5 = require('md5');

/**
 * Removes the duplicate paths from the database
 * and updates the documents who references the duplicated paths
 * to the unique paths.
 * 
 * It also creates a new table called 'duplicate-to-unique-path-ID' in a 
 * specified database which maps the path IDs of duplicate paths to the path IDs 
 * of unique paths.
 */
class DuplicatedPathsRemover{

    /**
     * Constructs the DuplicatedPathsRemover.
     * @param {Database} oldDb The old database
     * @param {*} newDb The new database
     * @param {*} mappingDb The database used to save mappings 
     *  from duplicate paths to unique paths.
     */
    constructor(oldDb, newDb, mappingDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
        this.mappingDb = mappingDb;
    }

    /**
     * Updates the trips' path ID that links from a duplicate path
     * to a unique path.
     */
    updateTrips(){
        return new Promise(async (resolve, reject) => {
            let duplicatesCursor = await this.mappingDb.getObjects("duplicate-to-unique-path-ID", {});
            while (await duplicatesCursor.hasNext()){
                let duplicateMapping = await duplicatesCursor.next();

                let affectedTripsCursor = await this.oldDb.getObjects("trips", { 
                    "pathID": duplicateMapping.oldID 
                });

                while (await affectedTripsCursor.hasNext()){
                    let affectedTrip = await affectedTripsCursor.next();
                    await this.oldDb.updateObject("trips", 
                        { _id: affectedTrip._id }, 
                        { $set: { "pathID": duplicateMapping.newID } }
                    );
                }
            }
            resolve();
        });
    }

    /**
     * Computes the hash of a list of coordinates
     * @param {Object[]} coordinates A list of coordinates
     * @returns {String} The hash of the coordinates
     */
    computeCoordinatesHash(coordinates){
        var hash = JSON.stringify(coordinates);
        return md5(hash);
    }

    /**
     * Runs the app.
     */
    processData(){
        return new Promise(async (resolve, reject) => {
            let pathsCursor = await this.oldDb.getObjects("paths", {});
            while(await pathsCursor.hasNext()){
                let path = await pathsCursor.next();
                let hashcode = this.computeCoordinatesHash(path.location.coordinates);

                // Only modify trips it when it does exist in the table
                let existingPath = await this.newDb.getObject("paths", { "hash": hashcode });
                if (existingPath){
                    await this.mappingDb.saveObjectToDatabase("duplicate-to-unique-path-ID", {
                        oldID: path.pathID,
                        newID: existingPath.pathID
                    });
                }
                else{
                    path.hash = hashcode;
                    await this.newDb.saveObjectToDatabase("paths", path);
                }
            }
            console.log("Finished removing duplicated paths");
            console.log("Updating affected trips");

            await this.updateTrips();
            console.log("Finished updating affected trips");
            resolve();
        });
    }
}

module.exports = DuplicatedPathsRemover;

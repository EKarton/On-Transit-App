const md5 = require('md5');

/**
 * Removes any duplicate stop locations by saving the unique
 * stop locations in a new database.
 * 
 * Computes the hash of each stop location from the old database
 * and stores them in the new database for faster computations.
 * 
 * Also stores the mappings of duplicate stop locations' stop ID
 * to the unique stop locations' stop ID.
 */
class DuplicateStopLocationsResolver {

    /**
     * 
     * @param {Database} oldDb A database with the stop locations.
     * @param {Database} newDb A database used to store the unique stop locations
     * @param {Database} mappingDb A database used to store the mappings
     */
    constructor(oldDb, newDb, mappingDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
        this.mappingDb = mappingDb;
    }

    /**
     * Updates the affected schedules to the unique stop locations 
     * whose schedules link to duplicate stop locations.
     * 
     * It updates the schedules directly in the old database.
     */
    updateSchedules(){
        return new Promise(async (resolve, reject) => {
            let duplicatesCursor = await this.mappingDb.getObjects("duplicate-to-unique-stop-location-ID", {});
            while (await duplicatesCursor.hasNext()){
                let duplicateMapping = await duplicatesCursor.next();
                let oldID = duplicateMapping.oldID;
                let newID = duplicateMapping.newID;

                let affectedSchedulesCursor = await this.oldDb.getObjects("schedules", {
                    "locationIDs": oldID
                });

                while (await affectedSchedulesCursor.hasNext()){
                    let affectedSchedules = await affectedSchedulesCursor.next();
                    let newLocationIDs = affectedSchedules.locationIDs.map(item => {
                        return item === oldID ? newID : item
                    });

                    await this.oldDb.updateObject("schedules", 
                        { "_id": affectedSchedules._id }, 
                        { $set: { "locationIDs": newLocationIDs } }
                    );
                }
            }
            resolve();
        });
    }

    /**
     * Computes the hash code of the stop location.
     * @param {Object} stopLocation The stop location
     * @returns {String} The hash code of the stop location.
     */
    computeHash(stopLocation){
        let hash = "";
        hash += "[" + stopLocation.name + "]";
        hash += "[" + stopLocation.description + "]";
        hash += "" + stopLocation.latitude;
        hash += "," + stopLocation.longitude;
        return md5(hash);
    }

    /**
     * Runs the app.
     */
    processData(){
        return new Promise(async (resolve, reject) => {
            let stopLocationsCursor = await this.oldDb.getObjects("stop-locations", {});
            while (await stopLocationsCursor.hasNext()){
                let stopLocation = await stopLocationsCursor.next();
                let hashCode = this.computeHash(stopLocation);

                let alreadyFoundStopLocaton = await this.newDb.getObject("stop-locations", {
                    hash: hashCode
                });
                if (alreadyFoundStopLocaton){
                    await this.mappingDb.saveObjectToDatabase("duplicate-to-unique-stop-location-ID", {
                        oldID: stopLocation.stopLocationID,
                        newID: alreadyFoundStopLocaton.stopLocationID
                    });
                }
                else{
                    stopLocation.hash = hashCode;
                    await this.newDb.saveObjectToDatabase("stop-locations", stopLocation);
                }
            }
            console.log("Finished removing duplicates from stop-locations");
            console.log("Updating affected schedules");

            await this.updateSchedules();
            console.log("Finished updating schedules");
            resolve();
        });
    }
}

module.exports = DuplicateStopLocationsResolver;

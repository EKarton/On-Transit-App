const md5 = require('md5');

/**
 * Removes duplicate trips by storing the unique trips
 * in a new database.
 * 
 * It requires computing and storing the hash code of each unique
 * trip in the new database for faster computations.
 * 
 * It also updates the schedules who link to a duplicated trip.
 */
class DuplicatedTripsRemover {

    /**
     * Constructs the DuplicatedTripsRemover
     * @param {Database} oldDb The database with duplicated trips
     * @param {Database} newDb The database used to store unique trips
     * @param {Database} mappingDb Stores the mappings of duplicated trips to unique trips.
     */
    constructor(oldDb, newDb, mappingDb) {
        this.oldDb = oldDb;
        this.newDb = newDb;
        this.mappingDb = mappingDb;
    }

    /**
     * Updates the schedules that were linked to a duplicated trip
     * to the unique trips in the new database.
     * 
     * It updates the schedules in the old database.
     */
    updateSchedules(){
        return new Promise(async (resolve, reject) => {
            let duplicateCursor = await this.mappingDb.getObjects("duplicate-to-unique-trip-IDs", {});
            while (await duplicateCursor.hasNext()){
                let duplicateMapping = await duplicateCursor.next();
                let oldID = duplicateMapping.oldID;
                let newID = duplicateMapping.newID;

                await this.oldDb.updateObjects("schedules", 
                    { "tripID": oldID }, 
                    { $set: { "tripID": newID } });
            }
            resolve();
        });
    }

    /**
     * Computes the hash code of a trip object
     * @param {Object} trip The trip object
     * @returns {String} The hash code of the trip object
     */
    computeHashCode(trip){
        let hash = "";
        hash += trip.pathID;
        hash += "|" + trip.shortName;
        hash += "|" + trip.longName;
        hash += "|" + trip.tripLongName;
        hash += "|" + trip.headsign;
        hash += "|" + trip.type;
        return md5(hash);
    }

    /**
     * Runs the entire app.
     */
    processData() {
        return new Promise(async (resolve, reject) => {
            let tripsCursor = await this.oldDb.getObjects("trips", {});
            while (await tripsCursor.hasNext()) {
                let trip = await tripsCursor.next();
                let hashcode = this.computeHashCode(trip);

                // See if there is a duplicate 
                let duplicatedTrip = await this.newDb.getObject("trips", {
                    "hash": hashcode
                });

                // Do not add the duplicate to the new DB 
                if (duplicatedTrip){
                    await this.mappingDb.saveObjectToDatabase("duplicate-to-unique-trip-IDs", {
                        oldID: trip.tripID,
                        newID: duplicatedTrip.tripID
                    });
                } 
                else {
                    trip.hash = hashcode;
                    await this.newDb.saveObjectToDatabase("trips", trip);
                }
            }
            await this.updateSchedules();

            resolve();
        });
    }
}

module.exports = DuplicatedTripsRemover;

const md5 = require('md5');

class DuplicatedTripsRemover {
    constructor(oldDb, newDb, mappingDb) {
        this.oldDb = oldDb;
        this.newDb = newDb;
        this.mappingDb = mappingDb;
    }

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
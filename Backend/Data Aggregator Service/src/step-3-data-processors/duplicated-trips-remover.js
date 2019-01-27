
class DuplicatedTripsRemover {
    constructor(oldDb, newDb) {
        this.oldDb = oldDb;
        this.newDb = newDb;
    }

    processData() {
        return new Promise(async (resolve, reject) => {
            let tripsCursor = await this.oldDb.getObjects("trips", {});
            while (await tripsCursor.hasNext()) {
                let trip = await tripsCursor.next();

                // See if there is a duplicate 
                let duplicatedTrip = await this.newDb.getObject("trips", {
                    "pathID": trip.pathID,
                    "scheduleID": trip.scheduleID,
                    "shortName": trip.shortName,
                    "longName": trip.longName,
                    "tripLongName": trip.tripLongName,
                    "headSign": trip.headSign,
                    "type": trip.type
                });

                // Do not add the duplicate to the new DB 
                if (!duplicatedTrip) {
                    await this.newDb.saveObjectToDatabase("trips", trip);
                }
            }

            resolve();
        });
    }
}

module.exports = DuplicatedTripsRemover;
const Database = require("on-transit").Database;

class TripToScheduleDependencyResolver {

    /**
     * 
     * @param {Database} oldDb The old database
     * @param {Database} newDb The new database
     */
    constructor(db){
        this.db = db;
    }    

    processData(){
        return new Promise(async (resolve, reject) => {

            let tripsCursor = await this.db.getObjects("trips", {});
            while (await tripsCursor.hasNext()){
                let trip = await tripsCursor.next();
                let oldTripID = trip.tripID;
                let newTripID = trip._id;

                await this.db.updateObjects("schedules", 
                    { "tripID": oldTripID }, 
                    { $set: { "tripID": newTripID } }
                );
            }

            resolve();
        });
    }
}

module.exports = TripToScheduleDependencyResolver;

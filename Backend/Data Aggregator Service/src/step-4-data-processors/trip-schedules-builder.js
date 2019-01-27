const Database = require("on-transit").Database;


/**
 * Combines the schedules of trip data with the same pathID, 
 * shortName, longName, headSign, and type from the trip object:
 * {
 *      pathID: <PATH_ID>,
 *      shortName: <SHORT_NAME>,
 *      longName: <LONG_NAME>,
 *      headSign: <HEAD_SIGN>,
 *      type: <TYPE>,
 *      scheduleID: <SCHEDULE_ID>
 * }
 * 
 * into a new trip object: 
 * {
 *      pathID: <PATH_ID>,
 *      shortName: <SHORT_NAME>,
 *      longName: <LONG_NAME>,
 *      headSign: <HEAD_SIGN>,
 *      type: <TYPE>,
 *      schedules: [
 *          <SCHEDULE_ID_1>, 
 *          <SCHEDULE_ID_2>, 
 *          ..., 
 *          <SCHEDULE_ID_N>
 *      ]
 * }
 */
class SchedulesCombiner {

    /**
     * Initializes the SchedulesCombiner object
     * @param {Database} oldDb The old database
     * @param {Database} newDb The new database
     */
    constructor(oldDb, newDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
    }

    combineTripScheduleToTrip(){
        return new Promise(async (resolve, reject) => {            
            let tripsCursor = await this.oldDb.getObjects("trips", {});
            while (await tripsCursor.hasNext()){
                let trip = await tripsCursor.next();
                let tripID = trip.tripID;

                let tripSchedule = await this.newDb.getObject("trip-schedules", {
                    "tripID": tripID
                });

                trip.schedules = tripSchedule.tripSchedules;
                await this.newDb.saveObjectToDatabase("trips", trip);
            }
            resolve();
        });
    }

    processData(){
        return new Promise(async (resolve, reject) => {

            let aggregateCursor = await this.oldDb.getAggregatedObjects("schedules", [{
                $group: {
                    _id: {
                        "tripID": "$tripID"
                    },
                    tripSchedules: { $push: "$_id" }
                }
            }]);

            let insertionJobs = [];
            while (await aggregateCursor.hasNext()){
                let obj = await aggregateCursor.next();
                let newTripObject = {
                    tripID: obj._id.tripID,
                    tripSchedules: obj.tripSchedules
                };
                insertionJobs.push(this.newDb.saveObjectToDatabase("trip-schedules", newTripObject));
            }
            await Promise.all(insertionJobs);
            console.log("Finished aggregating schedules with same trip ID");
            console.log("Appending trip schedules to each trip");

            await this.combineTripScheduleToTrip();
            console.log("Finished appending trip schedules to each trip");

            resolve();
        });
    }
}

module.exports = SchedulesCombiner;
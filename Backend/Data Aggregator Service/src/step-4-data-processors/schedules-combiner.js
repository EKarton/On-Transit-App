const Database = require("on-transit").Database;

/**
 * Combines the trip schedules of similar trips to one object.
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

    processAggregatedData(aggregatedData){
        return new Promise(async (resolve, reject) => {
            let scheduleIDs = aggregatedData.tripSchedules;
            let aggregateCursor = await this.oldDb.getAggregatedObjects("schedules", [
                {
                    $match: { "_id": { $in: scheduleIDs } }
                },
                {
                    $project: {
                        _id: 1,
                        times: 1,
                        locationIDs: 1,
                        headsigns: 1,
                        startTimeObj: { $arrayElemAt: [ "$times", 0 ] },
                    }
                },
                {
                    $project: {
                        _id: 1,
                        times: 1,
                        locationIDs: 1,
                        headsigns: 1,
                        startTime: "$startTimeObj.arrivalTime",
                    }
                },
                {
                    $match: { "startTime": { $gte: 42000 } }
                },
                {
                    $sort: {
                        "startTime": 1
                    }
                },
                {
                    $group: {
                        _id: { "locationIDs": "$locationIDs", "headsigns": "$headsigns" },
                        timetable: { $push: "$times" }
                    }
                }
            ]);

            while (await aggregateCursor.hasNext()){
                let combinedSchedule = await aggregateCursor.next();
                combinedSchedule.timetable = combinedSchedule.timetable.map(trip => {
                    return trip.map(stopTime => {
                        return [stopTime.arrivalTime, stopTime.departTime];
                    })
                });

            }
            aggregateCursor.close();
        });
    }

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
     *      tripSchedules: [
     *          <SCHEDULE_ID_1>, 
     *          <SCHEDULE_ID_2>, 
     *          ..., 
     *          <SCHEDULE_ID_N>
     *      ]
     * }
     */
    processData(){
        return new Promise(async (resolve, reject) => {
            let aggregateCursor = await this.oldDb.getAggregatedObjects("trips", [{
                $group: {
                    _id: {
                        "pathID": "$pathID",
                        "shortName": "$shortName",
                        "longName": "$longName",
                        "headSign": "$headSign",
                        "type": "$type"
                    },
                    tripSchedules: { $push: "$scheduleID" }
                }
            }]);

            let insertionJobs = [];
            while (await aggregateCursor.hasNext()){
                let obj = await aggregateCursor.next();
                let newTripObject = {
                    pathID: obj._id.pathID,
                    shortName: obj._id.shortName,
                    longName: obj._id.longName,
                    headSign: obj._id.headSign,
                    type: obj._id.type,
                    tripSchedules: obj.tripSchedules
                };
                // console.log(newTripObject);
                insertionJobs.push(this.newDb.saveObjectToDatabase("trips", newTripObject));
            }
            await Promise.all(insertionJobs);

            resolve();
        });
    }
}

module.exports = SchedulesCombiner;
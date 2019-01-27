const Database = require("on-transit").Database;

class TripScheduleBuilder{

    /**
     * Initializes the Trip Schedule Builder
     * @param {Database} oldDb Connection to the old database
     * @param {Database} newDb Connection to the new database
     */
    constructor(oldDb, newDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
    }

    computeHash(times, locationIDs, headsigns){
        let hash = "";
        hash += "ts:" + JSON.stringify(times);
        hash += ";l:" + JSON.stringify(locationIDs);
        hash += ";h:" + JSON.stringify(headsigns);
        return hash; 
    }

    /**
     * Combines data with the same trip ID from multiple objects:
     * {
     *      tripID: <TRIP_ID>,
     *      stopLocationID: <STOP_LOCATION_ID>,
     *      arrivalTime: <ARRIVAL_TIME>,
     *      departTime: <DEPART_TIME>,
     *      sequence: <SEQUENCE>,
     *      headsign: <HEADSIGN>
     * }
     * 
     * to a singular object:
     * {
     *      tripID: <TRIP_ID>,
     *      times: [(A1, D1), (A2, D2), ..., (An, Dn)],
     *      locations: [L1, L2, ..., Ln],
     *      headsigns: [H1, H2, ..., Hn],
     *      hash: <HASH_CODE>,
     *      startTime: <START_TIME>,
     *      endTime: <END_TIME>
     * }
     * 
     * where Ai is the arrival time, Di is the depart time,
     * times[], locations[], and headsign[] are sorted by their sequence number.
     */
    processData(){
        return new Promise(async (resolve, reject) => {
            let rawTripsCursor = this.oldDb.getObjects("raw-trips", {});
            while (await rawTripsCursor.hasNext()){
                let rawTrip = await rawTripsCursor.next();
                let tripID = rawTrip.tripID;

                // Ensure that the same trip ID does not exist in the new db.
                let existingSchedule = await this.newDb.getObject("schedules", { "tripID": tripID });
                if (!existingSchedule){

                    // Get all the stops that the bus / train will travel to.
                    let rawStopTimesCursor = this.oldDb.getObjects("raw-stop-times", { "tripID": tripID });
                    let rawStopTimes = [];
                    while (await rawStopTimesCursor.hasNext()){
                        let rawStopTime = await rawStopTimesCursor.next();
                        rawStopTimes.push(rawStopTime);
                    }
                    
                    // Sort the stop times by the sequence of trips the bus / train will travel to.
                    rawStopTimes = rawStopTimes.sort((a, b) => {
                        let sequenceA = a.sequence;
                        let sequenceB = b.sequence;

                        if (sequenceA < sequenceB){
                            return -1;
                        }
                        else{
                            return 1;
                        }
                    });

                    // Combine the list to one object
                    let times = rawStopTimes.map(a => {
                        return [a.arrivalTime, a.departTime];
                    });
                    let numStops = times.length;
                    let startTime = times[0][0];
                    let endTime = times[numStops - 1][1];
                    let locationIDs = rawStopTimes.map(a => a.stopLocationID);
                    let headsigns = rawStopTimes.map(a => a.headsign);
                    let hashcode = this.computeHash(times, locationIDs, headsigns);

                    let tripSchedule = {
                        tripID: tripID,
                        startTime: startTime,
                        endTime: endTime,
                        times: times,
                        locationIDs: locationIDs,
                        headsigns: headsigns,
                        hash: hashcode
                    };

                    await this.newDb.saveObjectToDatabase("schedules", tripSchedule);
                }
            }

            resolve();
        });
    }
}

module.exports = TripScheduleBuilder;

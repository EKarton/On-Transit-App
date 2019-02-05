const Database = require("on-transit").Database;

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

    /**
     * Runs and aggregates the data
     */
    async processData(){
        function map(){
            let key = this.tripID;
    
            let value = {
                schedules: [{
                    arrivalTime: this.arrivalTime,
                    departTime: this.departTime,
                    headsign: this.headsign,
                    sequence: this.sequence,
                    locationID: this.stopLocationID
                }],
                count: 0
            };
    
            emit(key, value);
        }

        function reduce(key, values){
            var newValues = {
                schedules: [],
                count: 0
            };
    
            values.forEach(function (value){
                newValues.schedules = value.schedules.concat(newValues.schedules);
                newValues.count += value.count;
            });
            return newValues;
        }

        function finalize(key, reducedValues){
            let schedules = reducedValues.schedules;
            let sortedValues = schedules.sort((a, b) => {
                let sequenceA = a.sequence;
                let sequenceB = b.sequence;
    
                if (sequenceA < sequenceB){
                    return -1;
                }
                else{
                    return 1;
                }
            });
    
            let locationIDs = sortedValues.map(a => a.locationID);
            let headsigns = sortedValues.map(a => a.headsign);
    
            let times = sortedValues.map(a => [a.arrivalTime, a.departTime]);
            let numStops = times.length;
            let startTime = times[0][0];
            let endTime = times[numStops - 1][1];
    
            let aggregatedSchedule = {
                startTime: startTime,
                endTime: endTime,
                times: times,
                locationIDs: locationIDs,
                headsigns: headsigns
            };
    
            return aggregatedSchedule;
        }

        await this.oldDb.getInstance().collection("raw-stop-times").mapReduce(
            map,
            reduce,
            {
                out: "computed-schedules",
                finalize: finalize
            }
        );

        let oldSchedulesCursor = await this.oldDb.getObjects("computed-schedules", {});
        while (await oldSchedulesCursor.hasNext()){
            let obj = await oldSchedulesCursor.next();
            let newObj = {
                tripID: obj._id,
                startTime: obj.value.startTime,
                endTime: obj.value.endTime,
                times: obj.value.times,
                headsigns: obj.value.headsigns,
                locationIDs: obj.value.locationIDs
            }
            await this.newDb.saveObjectToDatabase("schedules", newObj);
        }
    }
}

module.exports = TripScheduleBuilder;

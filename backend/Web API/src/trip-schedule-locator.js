class ScheduleLocator{

    constructor(database){
        this.database = database;
    }

    async getScheduleBasedOnTime(time){
        var tripIDs = [];
        var cursor = this.database.getObjects("stopLocations", {});
        while (await cursor.hasNext()){
            var rawStopLocation = await cursor.next();
            var startTime = rawStopLocation.startTime;
            var endTime = rawStopLocation.endTime;

            if (startTime <= time && time <= endTime){
                tripIDs.push(rawStopLocation);
            }
        }
        return tripIDs;
    }
}

module.imports = ScheduleLocator;
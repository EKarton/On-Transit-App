
class ScheduleToStopLocationDependencyResolver {
    constructor(db){
        this.db = db;
    }

    processData(){
        return new Promise(async (resolve, reject) => {
            let schedulesCursor = await this.db.getObjects("schedules", {});

            while (await schedulesCursor.hasNext()){
                let schedule = await schedulesCursor.next();
                let locationIDs = schedule.locationIDs;

                let newLocationIDs = [];
                for (let i = 0; i < locationIDs.length; i++){
                    let oldLocationID = locationIDs[i];
                    let location = await this.db.getObject("stop-locations", {"stopLocationID": oldLocationID});
                    let newLocationID = location._id;
                    newLocationIDs.push(newLocationID);
                }

                await this.db.updateObject("schedules", 
                    { "_id": schedule._id }, 
                    { $set: { "locationIDs": newLocationIDs } }
                );
            }

            resolve();
        });
    }
}

module.exports = ScheduleToStopLocationDependencyResolver;
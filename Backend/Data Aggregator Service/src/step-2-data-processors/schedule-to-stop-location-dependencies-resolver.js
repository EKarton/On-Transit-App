
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
                    let locationID = locationIDs[i];
                    let location = await this.db.getObject("stop-locations", { "stopLocationID": locationID });
                    if (location){
                        let newLocationID = location._id;
                        newLocationIDs.push(newLocationID);
                    }
                    else{
                        console.log("ERROR WITH SCHEDULE ID: " + schedule._id);
                        console.log("ERROR! Cannot find: " + locationID);
                        console.log(JSON.stringify(locationIDs));
                        newLocationIDs.push(location);
                    }
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
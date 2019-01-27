
class TripToScheduleDependencyResolver {
    constructor(db){
        this.db = db;
    }    

    processData(){
        return new Promise(async (resolve, reject) => {

            // Add the scheduleID to each trip
            let schedules = await this.db.getObjects("schedules", {});
            while(await schedules.hasNext()){
                let schedule = await schedules.next();
                let scheduleID = schedule._id;
                let tripID = schedule.tripID;

                await this.db.updateObject("trips", 
                    { "tripID": tripID }, 
                    { $set: { "scheduleID": scheduleID } }
                );
            }
            resolve();
        });
    }
}

module.exports = TripToScheduleDependencyResolver;

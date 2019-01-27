
class DuplicatedSchedulesRemover {
    constructor(oldDb, newDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
    }

    processData() {
        return new Promise(async (resolve, reject) => {
            let schedulesCursor = await this.oldDb.getObjects("schedules", {});
            while (await schedulesCursor.hasNext()){
                let schedule = await schedulesCursor.next();
                let hash = schedule.hash;

                let duplicatedSchedule = await this.newDb.getObject("schedules", { "hash": hash });
                if (duplicatedSchedule){
                    
                    /**
                     * Find the trips whose schedule points to the current schedule in the old DB, and
                     * make it point to the schedule in the new DB.
                     */
                    await this.oldDb.updateObjects("trips", 
                        { "scheduleID": schedule._id }, 
                        { $set: { "scheduleID": duplicatedSchedule._id } }
                    );
                }
                else{
                    await this.newDb.saveObjectToDatabase("schedules", schedule);
                }
            }
            resolve();
        });
    }
}

module.exports = DuplicatedSchedulesRemover;
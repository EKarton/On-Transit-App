const md5 = require('md5');

class DuplicatedSchedulesRemover {
    constructor(oldDb, newDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
    }

    computeHash(schedule){
        let hash = "";
        hash += schedule.tripID;
        hash += "|" + JSON.stringify(schedule.times);
        hash += "|" + JSON.stringify(schedule.locationIDs);
        hash += "|" + JSON.stringify(schedule.headsigns);
        return md5(hash); 
    }

    processData() {
        return new Promise(async (resolve, reject) => {
            let schedulesCursor = await this.oldDb.getObjects("schedules", {});
            while (await schedulesCursor.hasNext()){
                let schedule = await schedulesCursor.next();
                let hashCode = this.computeHash(schedule);

                let duplicatedSchedule = await this.newDb.getObject("schedules", { "hash": hashCode });
                if (!duplicatedSchedule){
                    schedule.hash = hashCode;
                    await this.newDb.saveObjectToDatabase("schedules", schedule);
                }
            }
            resolve();
        });
    }
}

module.exports = DuplicatedSchedulesRemover;
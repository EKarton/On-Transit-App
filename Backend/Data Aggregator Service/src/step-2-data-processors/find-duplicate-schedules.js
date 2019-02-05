const md5 = require('md5');

/**
 * Removes duplicate schedules from the database
 * by storing the unique schedules in a separate database.
 * 
 * It also stores the hash of each schedule object
 * for faster computations.
 */
class DuplicatedSchedulesRemover {

    /**
     * Constructs the DuplicatedSchedulesRemover
     * @param {Database} oldDb The old database
     * @param {Database} newDb The new database
     */
    constructor(oldDb, newDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
    }

    /**
     * Computes the hash of a schedule object.
     * @param {Object} schedule A schedule
     * @returns {String} The hash of the schedule.
     */
    computeHash(schedule){
        let hash = "";
        hash += schedule.tripID;
        hash += "|" + JSON.stringify(schedule.times);
        hash += "|" + JSON.stringify(schedule.locationIDs);
        hash += "|" + JSON.stringify(schedule.headsigns);
        return md5(hash); 
    }

    /**
     * Runs the application.
     */
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

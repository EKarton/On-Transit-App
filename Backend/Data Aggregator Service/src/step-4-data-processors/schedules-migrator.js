
/**
 * Copies the schedules from the old DB to the new DB with their IDs
 * dynamically set by the new database.
 * 
 * It also updates each schedule object from the old DB with the new set
 * of stop location IDs in the new database.
 * 
 * The algorithm:
 * Each time we send an object to the new DB, it will return back the document ID.
 * That document ID will get placed in the mappings DB, where the key is the old 
 * document ID from the old DB, and the value is the new document ID.
 */
class SchedulesMigrator{

    /**
     * Constructs the SchedulesMigrator
     * @param {Database} oldDb The old database
     * @param {Database} newDb The new database
     * @param {Database} mappingsDb The database used to store the stop locations' 
     *  IDs from the old DB to the new stop locations' IDs in the new DB.
     */
    constructor(oldDb, newDb, mappingsDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
        this.mappingsDb = mappingsDb;
    }

    /**
     * Obtains a list of the new location IDs given a list
     * of old location IDs.
     * 
     * The mappings from the old location IDs to the new location IDs must be stored 
     * in the mappings DB with the collection name 'stop-location-ID-mappings'
     * 
     * @param {String[]} oldLocationIDs A set of old location IDs
     * @returns {String[]} A set of new location IDs
     */
    getNewLocationIDs(oldLocationIDs){
        return new Promise(async (resolve, reject) => {

            let newLocationIDPromises = oldLocationIDs.map(oldLocationID => {
                return new Promise(async (resolveJob, rejectJob) => {
                    let mapping = await this.mappingsDb.getObject("stop-location-ID-mappings", {
                        oldID: oldLocationID
                    });
                    let newLocationID = mapping.newID;
                    resolveJob(newLocationID);
                });
            });

            let newLocationIDs = await Promise.all(newLocationIDPromises);
            resolve(newLocationIDs);
        });
    }

    /**
     * Runs the app
     */
    processData(){
        return new Promise(async (resolve, reject) => {
            
            let oldScheduleCursor = await this.oldDb.getObjects("schedules", {});
            while(await oldScheduleCursor.hasNext()){
                let oldSchedule = await oldScheduleCursor.next();
                let newLocationIDs = await this.getNewLocationIDs(oldSchedule.locationIDs);

                let newSchedule = {
                    startTime: oldSchedule.startTime,
                    endTime: oldSchedule.endTime,
                    times: oldSchedule.times,
                    headsigns: oldSchedule.headsigns,
                    locationIDs: newLocationIDs
                }

                let newDocument = await this.newDb.saveObjectToDatabase("schedules", newSchedule);
                let newScheduleID = newDocument.insertedId;

                await this.mappingsDb.saveObjectToDatabase("schedule-ID-mappings", {
                    oldID: oldSchedule._id,
                    newID: newScheduleID
                });
            }

            resolve();
        });
    }
}

module.exports = SchedulesMigrator;

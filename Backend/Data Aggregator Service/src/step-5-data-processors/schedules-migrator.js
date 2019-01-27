
/**
 * The algorithm:
 * Each time we send a path to the new DB, it will return back the document ID.
 * That document ID will get placed in the mappings DB, where the key is the old 
 * document ID from the old DB, and the value is the new document ID.
 */
class StopLocationsMigrator{
    constructor(oldDb, newDb, mappingsDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
        this.mappingsDb = mappingsDb;
    }

    getNewLocationIDs(oldLocationIDs){
        return new Promise(async (resolve, reject) => {

            let newJobs = oldLocationIDs.map(oldLocationID => {
                return new Promise(async (resolveJob, rejectJob) => {
                    let mapping = await this.mappingsDb.getObject("stop-location-ID-mappings", {
                        oldDocumentID: oldLocationID
                    });
    
                    let newDocumentID = mapping.newDocumentID;
                    resolveJob(newDocumentID);
                });
            });

            let newLocationIDs = await Promise.all(newJobs);
            resolve(newLocationIDs);
        });
    }

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
                    oldDocumentID: oldSchedule._id,
                    newDocumentID: newScheduleID
                });
            }

            resolve();
        });
    }
}

module.exports = StopLocationsMigrator;
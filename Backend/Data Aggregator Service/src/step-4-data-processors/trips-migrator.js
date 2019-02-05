
/**
 * The algorithm:
 * Each time we send a path to the new DB, it will return back the document ID.
 * That document ID will get placed in the mappings DB, where the key is the old 
 * document ID from the old DB, and the value is the new document ID.
 */
class TripsMigrator{
    constructor(oldDb, newDb, mappingsDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
        this.mappingsDb = mappingsDb;
    }

    async getNewPathID(oldPathID){
        let mapping = await this.mappingsDb.getObject("path-ID-mappings", {
            oldID: oldPathID
        });
        return mapping.newID;
    }

    async getNewTripSchedules(oldSchedules){

        let newSchedulePromises = oldSchedules.map(oldSchedule => {
            return new Promise(async (resolveJob, rejectJob) => {
                let mapping = await this.mappingsDb.getObject("schedule-ID-mappings", {
                    oldID: oldSchedule
                });
                let newID = mapping.newID;
                resolveJob(newID);
            });
        });

        return await Promise.all(newSchedulePromises);
    }

    processData(){
        return new Promise(async (resolve, reject) => {
            let oldTripsCursor = await this.oldDb.getObjects("trips", {});
            while (await oldTripsCursor.hasNext()){
                let oldTripObj = await oldTripsCursor.next();

                let newPathID = await this.getNewPathID(oldTripObj.pathID);
                let newTripSchedules = await this.getNewTripSchedules(oldTripObj.schedules);

                let newTripObj = {
                    shortName: oldTripObj.shortName,
                    longName: oldTripObj.longName,
                    headSign: oldTripObj.headSign,
                    type: oldTripObj.type,
                    pathID: newPathID,
                    schedules: newTripSchedules
                }

                let newDocument = await this.newDb.saveObjectToDatabase("trips", newTripObj);
                let newDocumentID = newDocument.insertedId;

                await this.mappingsDb.saveObjectToDatabase("trip-ID-mappings", {
                    oldID: oldTripObj.tripID,
                    newID: newDocumentID
                });
            }
            resolve();
        });
    }
}

module.exports = TripsMigrator;
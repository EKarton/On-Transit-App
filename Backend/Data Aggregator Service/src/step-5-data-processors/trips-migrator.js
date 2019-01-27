
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
        console.log(oldPathID);
        let mapping = await this.mappingsDb.getObject("path-ID-mappings", {
            oldDocumentID: oldPathID
        });
        console.log(mapping);
        return mapping.newDocumentID;
    }

    async getNewTripSchedules(oldTripSchedules){

        let jobs = oldTripSchedules.map(oldDocumentID => {
            return new Promise(async (resolveJob, rejectJob) => {
                let mapping = await this.mappingsDb.getObject("schedule-ID-mappings", {
                    oldDocumentID: oldDocumentID
                });
                let newDocumentID = mapping.newDocumentID;

                resolveJob(newDocumentID);
            });
        });

        return await Promise.all(jobs);
    }

    processData(){
        return new Promise(async (resolve, reject) => {
            let oldTripsCursor = await this.oldDb.getObjects("trips", {});
            while (await oldTripsCursor.hasNext()){
                let oldTripObj = await oldTripsCursor.next();

                let newPathID = await this.getNewPathID(oldTripObj.pathID);
                let newTripSchedules = await this.getNewTripSchedules(oldTripObj.tripSchedules);

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
                    oldDocumentID: oldTripObj._id,
                    newDocumentID: newDocumentID
                });
            }
            resolve();
        });
    }
}

module.exports = TripsMigrator;
const md5 = require('md5');

class DuplicateStopLocationsResolver {
    constructor(oldDb, newDb, mappingDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
        this.mappingDb = mappingDb;
    }

    updateSchedules(){
        return new Promise(async (resolve, reject) => {
            let duplicatesCursor = await this.mappingDb.getObjects("duplicate-to-unique-stop-location-ID", {});
            while (await duplicatesCursor.hasNext()){
                let duplicateMapping = await duplicatesCursor.next();
                let oldID = duplicateMapping.oldID;
                let newID = duplicateMapping.newID;

                let affectedSchedulesCursor = await this.oldDb.getObjects("schedules", {
                    "locationIDs": oldID
                });

                while (await affectedSchedulesCursor.hasNext()){
                    let affectedSchedules = await affectedSchedulesCursor.next();
                    let newLocationIDs = affectedSchedules.locationIDs.map(item => {
                        return item === oldID ? newID : item
                    });

                    await this.oldDb.updateObject("schedules", 
                        { "_id": affectedSchedules._id }, 
                        { $set: { "locationIDs": newLocationIDs } }
                    );
                }
            }
            resolve();
        });
    }

    computeHash(stopLocation){
        let hash = "";
        hash += "[" + stopLocation.name + "]";
        hash += "[" + stopLocation.description + "]";
        hash += "" + stopLocation.latitude;
        hash += "," + stopLocation.longitude;
        return md5(hash);
    }

    processData(){
        return new Promise(async (resolve, reject) => {
            let stopLocationsCursor = await this.oldDb.getObjects("stop-locations", {});
            while (await stopLocationsCursor.hasNext()){
                let stopLocation = await stopLocationsCursor.next();
                let hashCode = this.computeHash(stopLocation);

                let alreadyFoundStopLocaton = await this.newDb.getObject("stop-locations", {
                    hash: hashCode
                });
                if (alreadyFoundStopLocaton){
                    await this.mappingDb.saveObjectToDatabase("duplicate-to-unique-stop-location-ID", {
                        oldID: stopLocation.stopLocationID,
                        newID: alreadyFoundStopLocaton.stopLocationID
                    });
                }
                else{
                    stopLocation.hash = hashCode;
                    await this.newDb.saveObjectToDatabase("stop-locations", stopLocation);
                }
            }
            console.log("Finished removing duplicates from stop-locations");
            console.log("Updating affected schedules");

            await this.updateSchedules();
            console.log("Finished updating schedules");
            resolve();
        });
    }
}

module.exports = DuplicateStopLocationsResolver;
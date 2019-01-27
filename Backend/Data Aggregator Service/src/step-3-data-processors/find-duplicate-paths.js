const md5 = require('md5');

class DuplicatedPathsRemover{
    constructor(oldDb, newDb, mappingDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
        this.mappingDb = mappingDb;
    }

    updateTrips(){
        return new Promise(async (resolve, reject) => {
            let duplicatesCursor = await this.mappingDb.getObjects("duplicate-to-unique-path-ID", {});
            while (await duplicatesCursor.hasNext()){
                let duplicateMapping = await duplicatesCursor.next();

                let affectedTripsCursor = await this.oldDb.getObjects("trips", { 
                    "pathID": duplicateMapping.oldID 
                });

                while (await affectedTripsCursor.hasNext()){
                    let affectedTrip = await affectedTripsCursor.next();
                    await this.oldDb.updateObject("trips", 
                        { _id: affectedTrip._id }, 
                        { $set: { "pathID": duplicateMapping.newID } }
                    );
                }
            }
            resolve();
        });
    }

    computeCoordinatesHash(coordinates){
        var hash = JSON.stringify(coordinates);
        return md5(hash);
    }

    processData(){
        return new Promise(async (resolve, reject) => {
            let pathsCursor = await this.oldDb.getObjects("paths", {});
            while(await pathsCursor.hasNext()){
                let path = await pathsCursor.next();
                let hashcode = this.computeCoordinatesHash(path.location.coordinates);

                // Only modify trips it when it does exist in the table
                let existingPath = await this.newDb.getObject("paths", { "hash": hashcode });
                if (existingPath){
                    await this.mappingDb.saveObjectToDatabase("duplicate-to-unique-path-ID", {
                        oldID: path.pathID,
                        newID: existingPath.pathID
                    });
                }
                else{
                    path.hash = hashcode;
                    await this.newDb.saveObjectToDatabase("paths", path);
                }
            }
            console.log("Finished removing duplicated paths");
            console.log("Updating affected trips");

            await this.updateTrips();
            console.log("Finished updating affected trips");
            resolve();
        });
    }
}

module.exports = DuplicatedPathsRemover;
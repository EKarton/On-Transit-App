class DuplicatedPathsRemover{
    constructor(oldDb, newDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
    }

    processData(){
        return new Promise(async (resolve, reject) => {
            let pathsCursor = await this.oldDb.getObjects("paths", {});
            while(await pathsCursor.hasNext()){
                let path = await pathsCursor.next();
                let pathHash = path.hash;

                // Only modify trips it when it does exist in the table
                let existingPath = await this.newDb.getObject("paths", { "hash": pathHash });
                if (existingPath){
                    await this.oldDb.updateObjects("trips", 
                        { "pathID": existingPath.pathID }, 
                        { $set: { "pathID": existingPath._id } }
                    );
                }
                else{
                    await this.newDb.saveObjectToDatabase("paths", path);
                }
            }
            resolve();
        });
    }
}

module.exports = DuplicatedPathsRemover;
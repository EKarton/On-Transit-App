const Database = require("./../common/database");

class CopyDatabase{

    /**
     * 
     * @param {Database} oldDatabase 
     * @param {Database} newDatabase 
     */
    constructor(oldDatabase, newDatabase){
        this._oldDatabase = oldDatabase;
        this._newDatabase = newDatabase;
    }    

    async copyData(collectionName){
        return new Promise(async (resolve, reject) => {
            try{
                var cursor = this._oldDatabase.getObjects(collectionName, {});
                while (await cursor.hasNext()){
                    var document = await cursor.next();
                    await this._newDatabase.saveObjectToDatabase(collectionName, document);
                }
                resolve();
            }
            catch(error){
                reject(error);
            }
        });
    }
}

module.exports = CopyDatabase;
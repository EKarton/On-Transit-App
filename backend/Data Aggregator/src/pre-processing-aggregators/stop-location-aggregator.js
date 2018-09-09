"use strict";

const Database = require("./../common/database");

class StopLocationAggregator{

    /**
     * 
     * @param {Database} rawDatabase The database that has the raw data
     * @param {Database} processedDatabase The database used to store the processed data
     */
    constructor(rawDatabase, processedDatabase){
        this._rawDatabase = rawDatabase;
        this._processedDatabase = processedDatabase;
    }

    processData(){
        return new Promise(async (resolve, reject) => {
            try{
                var cursor = await this._rawDatabase.getObjects("raw-stop-locations", {});
                while(await cursor.hasNext()){
                    var rawLocationData = await cursor.next();
                    await this._processedDatabase.saveObjectToDatabase("stop-locations", rawLocationData);
                }
                resolve();
            }
            catch(error){
                reject(error);
            }
        });
    }    
}

module.exports = StopLocationAggregator;
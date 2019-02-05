
/**
 * Copies all the stop locations from the old DB
 * to the new DB.
 */
class StopLocationsCopier {
    constructor(oldDb, newDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
    }

    /**
     * Runs the entire app in copying the stop locations from the 
     * old DB to the new DB.
     */
    processData(){
        return new Promise(async (resolve, reject) => {
            let oldStopLocationsCursor = await this.oldDb.getObjects("raw-stop-locations", {});
            while (await oldStopLocationsCursor.hasNext()){
                let obj = await oldStopLocationsCursor.next();
                await this.newDb.saveObjectToDatabase("stop-locations", obj);
            }
            resolve();
        });
    }
}

module.exports = StopLocationsCopier;

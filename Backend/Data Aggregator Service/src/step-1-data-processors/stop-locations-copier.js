
class StopLocationsCopier {
    constructor(oldDb, newDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
    }

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
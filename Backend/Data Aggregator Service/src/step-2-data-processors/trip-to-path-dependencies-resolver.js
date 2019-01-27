const Database = require("on-transit").Database;


class PathDependentsResolver{

    /**
     * 
     * @param {Database} oldDb 
     * @param {Database} newDb 
     */
    constructor(db){
        this.db = db
    }

    processData(){
        return new Promise(async (resolve, reject) => {

            let pathCursor = await this.db.getObjects("paths", {});
            while (await pathCursor.hasNext()){
                let pathObj = await pathCursor.next();
                let oldPathID = pathObj.pathID;
                let newPathID = pathObj._id;

                await this.db.updateObjects("trips", 
                    { pathID: oldPathID }, 
                    { $set: { pathID: newPathID } }
                );
            }
            resolve();
        });      
    }
}

module.exports = PathDependentsResolver;
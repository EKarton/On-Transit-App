const Database = require("on-transit").Database;


class PathDependentsResolver{

    /**
     * Constructs the PathDependentsResolver
     * @param {Database} db 
     */
    constructor(db){
        this.db = db;
    }

    processData(){
        return new Promise(async (resolve, reject) => {

            let pathCursor = await this.db.getObjects("paths", {});
            while (await pathCursor.hasNext()){
                let pathObj = await pathCursor.next();

                await this.db.updateObjects("trips", {
                    pathID: pathObj.pathID
                }, {
                    $set: { pathID: pathObj._id }
                });
            }
            resolve();
        });      
    }
}

module.exports = PathDependentsResolver;
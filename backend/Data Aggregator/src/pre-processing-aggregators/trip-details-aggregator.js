"use strict";

const Database = require("on-transit").Database;

class TripDetailsAggregator{

    constructor(rawDataDatabase, cleanDataDatabase){
        this.rawDataDatabase = rawDataDatabase;
        this.cleanDataDatabase = cleanDataDatabase;
    }

    processData(){
        return new Promise(async (resolve, reject) => {
            try{
                
                var cursor = await this.rawDataDatabase.getObjects("raw-trips", {});
                while (await cursor.hasNext()){
                    var rawData = await cursor.next();

                    var tripID = rawData._id;
                    var routeID = rawData.routeID;
                    var shapeID = rawData.shapeID;
                    var headsign = rawData.headSign;

                    var rawRouteData = await this.rawDataDatabase
                        .getObject("raw-routes", { "_id": routeID });

                    var shortname = rawRouteData.shortName;
                    var longname = rawRouteData.longname;

                    var parsedDatabaseObject = {
                        _id: tripID,
                        pathID: shapeID,
                        headsign: headsign,
                        shortname: shortname,
                        longname: longname
                    };

                    await this.cleanDataDatabase
                        .saveObjectToDatabase("trips", parsedDatabaseObject);
                }

                console.log("Finished aggregating trip data!");
                resolve();
            }
            catch(error){
                reject(error);
            }
        });
    }
}

module.exports = TripDetailsAggregator;
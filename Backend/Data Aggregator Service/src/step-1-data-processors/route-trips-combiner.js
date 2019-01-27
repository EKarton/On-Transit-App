const Database = require("on-transit").Database;

class RouteTripsCombiner{

    /**
     * Initializes the RouteTripsCombiner
     * @param {Database} oldDb The old database
     * @param {Database} newDb The new database 
     */
    constructor(oldDb, newDb){
        this.oldDb = oldDb;
        this.newDb = newDb;
    }

    processData(){
        return new Promise(async (resolve, reject) => {

            let rawTripsCursor = this.oldDb.getObjects("raw-trips", {});
            while(await rawTripsCursor.hasNext()){
                let rawTripObj = await rawTripsCursor.next();

                let tripID = rawTripObj.tripID.trim();
                let shapeID = rawTripObj.shapeID.trim();
                let routeID = rawTripObj.routeID.trim();
                let headSign = rawTripObj.headSign.trim();
                let tripShortName = rawTripObj.tripShortName.trim();

                let rawRouteData = await this.oldDb.getObject("raw-routes", { "routeID": routeID });
                let routeShortName = rawRouteData.shortName.trim();
                let routeLongName = rawRouteData.longName.trim();
                let routeType = rawRouteData.type.trim();
                
                /**
                 * What we want at the end:
                 * {
                 *    _id: <NEW_ROUTE_ID>,
                 *    shortName: <SHORT_NAME>,
                 *    longName: <LONG_NAME>,
                 *    headsign: <HEAD_SIGN>,
                 *    type: <TYPE_OF_TRANSPORTATION>
                 *    pathID: <NEW_PATH_ID>,
                 *    scheduleID: <NEW_SCHEDULE_ID>
                 * }
                 */
                let newTripObject = {
                    tripID: tripID,
                    pathID: shapeID,
                    shortName: routeShortName,
                    tripShortName: tripShortName,
                    longName: routeLongName,
                    headSign: headSign,
                    type: routeType,
                };

                await this.newDb.saveObjectToDatabase("trips", newTripObject);
            }
            resolve();
        });
    }
}

module.exports = RouteTripsCombiner;
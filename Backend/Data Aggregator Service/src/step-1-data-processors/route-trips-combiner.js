const Database = require("on-transit").Database;

/**
 * Combines trip and route data from two different collections 
 * with the same route ID
 * {
 *    tripID: <TRIP ID>,
 *    shapeID: <SHAPE ID>,
 *    routeID: <ROUTE ID>,
 *    headSign: <HEAD SIGN>,
 *    tripShortName: <TRIP SHORT NAME>
 * }
 * and
 * {
 *    routeID: <ROUTE ID>,
 *    shortName: <SHORT NAME>,
 *    longName: <LONG NAME>
 * }
 * 
 * into a single object:
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

    /**
     * Runs the entire app.
     */
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

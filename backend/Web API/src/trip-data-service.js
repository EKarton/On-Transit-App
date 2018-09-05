class TripDataService{
    constructor(database){
        this.database = database;
    }

    _getPathLocationData(pathLocationID){
        return new Promise(async (resolve, reject) => {
            try{
                var rawData = await this.database.getObject("pathLocations", { "_id": pathLocationID });
                    
                var latitude = rawData.latitude;
                var longitude = rawData.longitude;
                
                var pathLocation = {
                    lat: latitude,
                    long: longitude
                };
                resolve(pathLocation);
            }
            catch(error){
                reject(error);
            }
        });
    }

    _getPathData(pathID){
        return new Promise(async (resolve, reject) => {
            try{
                var paths = [];
                var rawPathData = await this.database.getObject("paths", { "_id": pathID });
                var pathLocationIDs = rawPathData.points;

                for (let i = 0; i < pathLocationIDs.length; i++){
                    let pathLocationID = pathLocationIDs[i];

                    var pathLocation = await this._getPathLocationData(pathLocationID);
                    paths.push(pathLocation);
                }

                resolve(paths);
            }
            catch(error){
                reject(error);
            }
        });
    }

    _getStopLocationFromStopLocationID(stopLocationID){
        return new Promise(async (resolve, reject) => {
            try{
                var rawData = await this.database
                    .getObject("stopLocations", { "_id": stopLocationID });

                var stopLocation = {
                    lat: rawData.latitude,
                    long: rawData.longitude,
                    name: rawData.name
                };
                resolve(stopLocation);
            }
            catch(error){
                reject(error);
            }
        });
    }

    _getStopsData(tripID){
        return new Promise(async (resolve, reject) => {
            try{
                let stops = [];

                let stopData = await this.database.getObject("stops", { "_id": tripID });
                let rawStops = stopData.stops;

                for (let i = 0; i < rawStops.length; i++) {
                    let rawStop = rawStops[i];

                    let stopLocationID = rawStop.stopLocationID;    
                    let arrivalTime = rawStop.arrivalTime;
                    let departTime = rawStop.departureTime;
                    
                    let stopLocation = await this._getStopLocationFromStopLocationID(stopLocationID);
                    if (stopLocation != null){
                        let stop = {
                            lat: stopLocation.lat,
                            long: stopLocation.long,
                            name: stopLocation.name,
                            time: arrivalTime
                        };

                        stops.push(stop);
                    }
                }
                resolve(stops);
            }
            catch(error){
                reject(error);
            }
        });
    }

    getTripData(tripID){
        return new Promise(async (resolve, reject) => {
            try{
                var trip = {
                    id: tripID,
                    shortName: "",
                    longName: "",
                    stops: [],
                    path: []
                };
        
                var rawRouteData = await this.database.getObject("trips", { "_id": tripID });
        
                trip.shortName = rawRouteData.shortName;
                trip.longName = rawRouteData.longName;
                trip.stops = await this._getStopsData(tripID);
                trip.path = await this._getPathData(rawRouteData.pathID);
                resolve(trip);
            }
            catch(error){
                reject(error);
            }
        });
    }
}

module.exports = TripDataService;
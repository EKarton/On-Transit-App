const request = require("request");
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');

const Vector = require("./vector");
const Circle = require("./circle");
const Geography = require("./geography");

class VehicleLocator{

    constructor(gtfsUrl = 'https://www.miapp.ca/GTFS_RT/Vehicle/VehiclePositions.pb'){
        this._gtfsUrl = gtfsUrl;
    }

    get gtfsUrl(){
        return this._gtfsUrl;
    }

    set gtfsUrl(newGtfsUrl){
        this._gtfsUrl = newGtfsUrl;
    }

    _getVehicles(){
        return new Promise((resolve, reject) => {
            var requestSettings = {
                method: 'GET',
                url: this._gtfsUrl,
                encoding: null
            };

            request(requestSettings, (error, response, body) => {
                if (error || response.statusCode != 200){
                    reject(error);
                }
                else{
                    var feed = GtfsRealtimeBindings.FeedMessage.decode(body);
                    var vehicles = [];

                    // Parse the feed and store the vehicles in the vehicles[]
                    var index = 0;
                    feed.entity.forEach(entity => {
                        var latitude = entity.vehicle.position.latitude;
                        var longitude = entity.vehicle.position.longitude;
                        var tripID = entity.vehicle.trip.trip_id;

                        vehicles.push({
                            tripID: tripID,
                            position: new Vector(longitude, latitude)
                        });

                        index ++;
                        if (index >= feed.entity.length){
                            resolve(vehicles);
                        }
                    });
                }
            });
        });
    }

    _isVehicleInGeofence(vehicle, geofence){
        var distance = Geography.calculateDistance(vehicle.position, geofence.centerPt);
        return distance <= geofence.radius;
    }

    getNearbyVehiclesByLocation(latitude, longitude, radius){        
        return new Promise(async (resolve, reject) => {
            try{
                var geofenceCenterPt = new Vector(longitude, latitude);
                var geofence = new Circle(geofenceCenterPt, radius);
                var vehicles = await this._getVehicles();
                
                var validVehicles = [];
                var index = 0;
                vehicles.forEach(vehicle => {

                    if (this._isVehicleInGeofence(vehicle, geofence)){
                        validVehicles.push(vehicle);
                    }

                    index ++;
                    if (index >= vehicles.length){
                        resolve(validVehicles);
                    }
                });

                resolve(validVehicles);
            }
            catch(error){
                reject(error);
            }
        });
    }
}

module.exports = VehicleLocator;
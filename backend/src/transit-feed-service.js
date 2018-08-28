"use strict;"

const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const request = require('request');
const fs = require("fs");

const EARTH_RADIUS = 6371000; // in meters

class TransitFeedService{

    /**
     * Converts degrees to radians
     * @param {number} degrees Angle in degrees
     * @return {number} Angle in radians
     */
    _convertDegreesToRadians(degrees){
        return degrees * Math.PI / 180;
    }

    /**
     * Calculates and returns the distance between two points.
     * Formula derived from https://www.movable-type.co.uk/scripts/latlong.html
     * @param {number} lat_1 The latitude of point 1
     * @param {number} long_1 The longitude of point 1
     * @param {number} lat_2 The latitude of point 2 
     * @param {number} long_2 The longitude of point 2
     * @return {number} Returns the distance between two points in meters
     */
    _calculateDistance(lat1, long1, lat2, long2){
        var dLat = this._convertDegreesToRadians(lat2 - lat1);
        var dLong = this._convertDegreesToRadians(long2 - long1);
        var lat1_rads = this._convertDegreesToRadians(lat1);
        var lat2_rads = this._convertDegreesToRadians(lat2);

        var a = Math.pow(Math.sin(dLat / 2), 2) +
                Math.pow(Math.sin(dLong / 2), 2) * 
                Math.cos(lat1_rads) * Math.cos(lat2_rads); 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return EARTH_RADIUS * c;
    }

    /**
     * Returns a list of transit lines that is close to a location by a certain radius
     * @param {number} latitude 
     * @param {number} longitude 
     * @param {number} radius
     * @returns {Promise} A promise
     */
    getNearbyVehiclesByLocation(latitude, longitude, radius){        
        var requestSettings = {
            method: 'GET',
            url: 'https://www.miapp.ca/GTFS_RT/Vehicle/VehiclePositions.pb',
            encoding: null
        };

        return new Promise((resolve, reject) => {
            request(requestSettings, (error, response, body) => {
                if (error || response.statusCode != 200){
                    reject(error);
                    return;
                }

                var feed = GtfsRealtimeBindings.FeedMessage.decode(body);

                fs.writeFile("busses.txt", JSON.stringify(feed));

                var validVehicles = [];
                var index = 0;

                feed.entity.forEach(entity => {
                    var vehiclePosition_latitude = entity.vehicle.position.latitude;
                    var vehiclePosition_longitude = entity.vehicle.position.longitude;

                    var distance = this._calculateDistance(latitude, longitude, 
                        vehiclePosition_latitude, vehiclePosition_longitude);

                    if (distance < radius){
                        validVehicles.push(entity.vehicle);
                    }

                    index ++;
                    if (index >= feed.entity.length){
                        resolve(validVehicles);
                    }
                });
            });
        });
    }

    /**
     * Returns a list of transit trips that are close to a location at a certain radius
     * @param {number} latitude 
     * @param {number} longitude 
     * @param {number} radius
     * @return {Promise} A promise
     */
    getNearbyTripsByLocation(latitude, longitude, radius){
        var requestSettings = {
            method: 'GET',
            url: '',
            encoding: null
        };

        return new Promise((resolve, reject) => {
            request(requestSettings, (error, response, body) => {
                if (error || response.statusCode != 200){
                    reject(error);
                    return;
                }
            });
        });
    }
}

module.exports = TransitFeedService;
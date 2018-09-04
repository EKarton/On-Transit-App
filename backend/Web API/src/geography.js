"use strict";

const Vector = require("./vector");

const EARTH_RADIUS = 6371000; // in meters

/**
 * A class used to perform geographical calculations on Earth.
 */
class Geography{

    static get EARTH_RADIUS(){
        return EARTH_RADIUS;
    }

    /**
     * Converts an angle from degrees to radians.
     * @param {number} degrees Angle in degrees
     * @return {number} Angle in radians
     */
    static convertDegreesToRadians(degrees){
        return degrees * Math.PI / 180;
    }

    /**
     * Computes the distance between two geographical locations on Earth.
     * Formula derived from https://www.movable-type.co.uk/scripts/latlong.html
     * Pre-condition:
     * - Values in point1.y and point2.y must be between -90 and 90 (inclusive)
     * - Values in point1.x and point2.x must be between -180 and 180 (inclusive)
     * 
     * @param {Vector} point1 One location
     * @param {Vector} point2 Another location
     * @return {number} The distance between "point1" and "point2", in meters.
     */
    static calculateDistance(point1, point2){

        // Get the latitude and longitude of each point
        var lat1 = point1.y;
        var long1 = point1.x;
        var lat2 = point2.y;
        var long2 = point2.x;

        var dLat = this.convertDegreesToRadians(lat2 - lat1);
        var dLong = this.convertDegreesToRadians(long2 - long1);
        var lat1_rads = this.convertDegreesToRadians(lat1);
        var lat2_rads = this.convertDegreesToRadians(lat2);

        var a = Math.pow(Math.sin(dLat / 2), 2) +
                Math.pow(Math.sin(dLong / 2), 2) * 
                Math.cos(lat1_rads) * Math.cos(lat2_rads); 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return EARTH_RADIUS * c;
    }

    static isStraightPathInGeofence(point1, point2, geofence){
        if (this.calculateDistance(point1, geofence.centerPt) < geofence.radius){
            return true;
        }
        else if (this.calculateDistance(point2, geofence.centerPt) < geofence.radius){
            return true;
        }
        else{
            // Compute the vectors from point1 to point2, and from point1 to the circle's centerPt
            var vector1 = Vector.substract(point2, point1);
            var vector2 = Vector.substract(geofence.centerPt, point1);

            // Compute the projection of vector2 on vector1
            var projection = Vector.proj(vector1, vector2);

            // Compute the actual coordinate of vector2 on vector1
            var projectionCoordinate = Vector.add(projection, point1);

            // Compute the length from circle's center pt to the projection coordinate
            var amountProjected = this.calculateDistance(projectionCoordinate, geofence.centerPt);

            if (amountProjected <= geofence.radius){
                return true;
            }
            return false;
        }
    }
}

module.exports = Geography;
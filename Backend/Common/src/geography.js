"use strict";

const Vector = require("./vector");
const BoundingBox = require("./bounding-box");

const EARTH_RADIUS = 6371000; // in meters

const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;

/**
 * A class used to perform geographical calculations on Earth.
 */
class Geography{

    /**
     * Returns the radius of the Earth, in meters
     * @return {number} The Earth's radius, in meters.
     */
    static get EARTH_RADIUS(){
        return EARTH_RADIUS;
    }

    static get MIN_LATITUDE(){
        return MIN_LATITUDE;
    }

    static get MAX_LATITUDE(){
        return MAX_LATITUDE;
    }

    static get MIN_LONGITUDE(){
        return MIN_LONGITUDE;
    }

    static get MAX_LONGITUDE(){
        return MAX_LONGITUDE;
    }

    /**
     * Converts an angle from degrees to radians.
     * @param {number} degrees Angle in degrees
     * @return {number} Angle in radians
     */
    static convertDegreesToRadians(degrees){
        return degrees * Math.PI / 180;
    }

    static convertRadiansToDegrees(radians){
        return (radians * 180) / Math.PI;
    }

    static getBoundingBoxOfGeofence(geofence){
        var latitude = geofence.centerPt.y;
        var longitude = geofence.centerPt.x;

        var latRads = Geography.convertDegreesToRadians(latitude);
        var longRads = Geography.convertDegreesToRadians(longitude);
        var angularDistance = geofence.radius / Geography.EARTH_RADIUS;

        // Calculating the min and max latitude and longitude;
        var minLat = latRads - angularDistance;
        var maxLat = latRads + angularDistance;

        // Handle the poles
        if (minLat < Geography.MIN_LATITUDE || maxLat > Geography.MAX_LATITUDE){
            minLat = Math.max(minLat, Geography.MIN_LATITUDE);
            maxLat = Math.max(maxLat, Geography.MAX_LATITUDE);

            var maxLong = MAX_LONGITUDE;
            var minLong = MIN_LONGITUDE;

            var minLat_Deg = Geography.convertRadiansToDegrees(minLat);
            var maxLat_Deg = Geography.convertRadiansToDegrees(maxLat);
            var minLong_Deg = Geography.convertRadiansToDegrees(minLong);
            var maxLong_Deg = Geography.convertRadiansToDegrees(maxLong);

            return new BoundingBox(minLong_Deg, maxLong_Deg, minLat_Deg, maxLat_Deg);
        }
        else{
            var latOfIntersect = Math.asin(latRads) / Math.cos(angularDistance);
            var latOfIntersect_Deg = Geography.convertRadiansToDegrees(latOfIntersect);
            
            var dLong = Math.asin(Math.sin(angularDistance) / Math.cos(latRads));

            var minLong = longRads - dLong;
            var maxLong = longRads + dLong;

            var minLat_Deg = Geography.convertRadiansToDegrees(minLat);
            var maxLat_Deg = Geography.convertRadiansToDegrees(maxLat);
            var minLong_Deg = Geography.convertRadiansToDegrees(minLong);
            var maxLong_Deg = Geography.convertRadiansToDegrees(maxLong);

            return new BoundingBox(minLong_Deg, maxLong_Deg, minLat_Deg, maxLat_Deg);
        }
    }

    /**
     * Computes the distance between two geographical locations on Earth.
     * Formula derived from https://www.movable-type.co.uk/scripts/latlong.html
     * This method computes the distance with the Earth's curvature in mind.
     * 
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

    /**
     * Determines whether a straight path on the Earth's surface 
     * intersects a circular geofence.
     * It takes Earth's curvature into account.
     * 
     * Pre-conditions:
     * - The values in point1.x, point2.x, and geofence.centerPt.x 
     *   must be longitude values from -90 to 90 degrees inclusively
     * - The values in point1.y and point2.y, and geofence.centerPt.y 
     *   must be latitude values from -180 to 180 degrees inclusively
     * - The Value in geofence.radius must be in meters.
     * 
     * @param {Vector} point1 A location on one end of the path
     * @param {Vector} point2 A location on the other end of the path
     * @param {Circle} geofence The geofence
     * @return {boolean} Returns true if the path intersects the geofence;
     *  else it returns false.
     */
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
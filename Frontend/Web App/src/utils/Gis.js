/**
 * A library used to perform GPS location calculations
 */
module.exports = {
    EARTH_RADIUS: 6371000, // in meters

    /**
     * Converts an angle from degrees to radians
     * @param {Float} degrees Angle in degrees
     * @returns {Float} Angle in radians
     */
    convertDegreesToRadians: function(degrees){
        return degrees * Math.PI / 180;
    },

    /**
     * Converts an angle from radians to degrees
     * @param {Float} radians Angle in radians
     * @returns {Float} Angle in degrees
     */
    convertRadiansToDegrees: function(radians){
        return (radians * 180) / Math.PI;
    },

    /**
     * Computes the bearing from the first GPS location to the last GPS location in degrees
     * @param {Float} lat1 The latitude of the first GPS location in degrees
     * @param {Float} long1 The longitude of the first GPS location in degrees
     * @param {Float} lat2 The latitude of the last GPS location in degrees
     * @param {Float} long2 The longitude of the last GPS location in degrees
     * @returns {Float} The bearing from the first GPS location to the last GPS location.
     */
    computeBearings: function(lat1, long1, lat2, long2){
        let y = Math.sin(long2 - long1) * Math.cos(lat2);
        let x = (Math.cos(lat1) * Math.sin(lat2)) - 
                (Math.sin(lat1) * Math.cos(lat2) * Math.cos(long2 - long1));
        let bearingInRadans = Math.atan2(y, x);
        let bearingInDegrees = this.convertRadiansToDegrees(bearingInRadans);
        return (bearingInDegrees + 180) % 360;
    },

    /**
     * Calculates the approximate location X distance away from a GPS location with a 
     * certain bearing from that GPS location.
     * 
     * It will return an object with the following structure:
     * {
     *      lat: <latitude of approximate location>
     *      long: <longitude of approximate location>
     * }
     * 
     * @param {Float} lat The latitude of the GPS location in degrees
     * @param {Float} long The longitude of the GPS location in degrees
     * @param {Float} bearing The bearing in degrees
     * @param {Float} distance The distance in meters
     * @returns {Object} The approximate location.
     */
    calculateDestinationPoint: function(lat, long, bearing, distance){
        let latInRads = this.convertDegreesToRadians(lat);
        let longInRads = this.convertDegreesToRadians(long);

        let angularDistance = distance / this.EARTH_RADIUS;
        let bearingInRads = this.convertDegreesToRadians(bearing);

        let lat2InRads = Math.asin(Math.sin(latInRads) * Math.cos(angularDistance) + 
                        Math.cos(latInRads) * Math.sin(angularDistance) * Math.cos(bearingInRads));
        let lat2InDegrees = this.convertRadiansToDegrees(lat2InRads);

        let y = Math.sin(bearingInRads) * Math.sin(angularDistance) * Math.cos(latInRads);
        let x = Math.cos(angularDistance) - Math.sin(latInRads) * Math.sin(lat2InRads);
        let long2InRads = longInRads + Math.atan2(y, x);
        
        
        let long2InDegrees = this.convertRadiansToDegrees(long2InRads);
        let normalizedLong2InDegrees = (long2InDegrees + 540) % 360 - 180;
        
        return {
            lat: lat2InDegrees,
            long: normalizedLong2InDegrees
        };
    },

    /**
     * Computes the distance between two GPS locations. It takes Earth's radius
     * into account.
     * @param {Float} lat1 The latitude of the first GPS location in radians
     * @param {Float} long1 The longitude of the first GPS location in radians
     * @param {Float} lat2 The latitude of the second GPS location in radians
     * @param {Float} long2 The longitude of the second GPS location in radians
     * @returns {Float} The distance between two GPS locations.
     */
    calculateDistance: function(lat1, long1, lat2, long2){
        var dLat = this.convertDegreesToRadians(lat2 - lat1);
        var dLong = this.convertDegreesToRadians(long2 - long1);
        var lat1_rads = this.convertDegreesToRadians(lat1);
        var lat2_rads = this.convertDegreesToRadians(lat2);

        var a = Math.pow(Math.sin(dLat / 2), 2) +
                Math.pow(Math.sin(dLong / 2), 2) * 
                Math.cos(lat1_rads) * Math.cos(lat2_rads); 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return this.EARTH_RADIUS * c;
    }
};
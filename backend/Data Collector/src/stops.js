const Stop = require("./stop");

class Stops{
    constructor(){
        this.stops = [];

        // Note that the max and min longitude and latitude is from -90 to 90
        this.minLatitude = 100;
        this.maxLatitude = -100;
        this.minLongitude = 100;
        this.maxLongitude = -100;
    }

    /**
     * Adds a stop to the list of stops
     * @param {Stop} stop The new stop to add
     */
    addStop(stop){

        // Update the min and max lat and longitude
        if (stop.longitude > this.maxLongitude){
            this.maxLongitude = stop.longitude;
        }

        if (stop.longitude < this.minLongitude){
            this.minLongitude = stop.longitude;
        }

        if (stop.latitude > this.maxLatitude){
            this.maxLatitude = stop.latitude;
        }

        if (stop.latitude < this.minLatitude){
            this.minLatitude = stop.latitude;
        }

        // Add the stop to the array
        this.stops.push(stop);
    }
}

module.exports = Stops;
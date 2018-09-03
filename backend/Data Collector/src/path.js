class Path{
    constructor(){
        this.points = [];

        // Note that the max and min longitude and latitude is from -90 to 90
        this.minLatitude = 100;
        this.maxLatitude = -100;
        this.minLongitude = 100;
        this.maxLongitude = -100;
    }

    addPoint(locationID, location){
        // Update the min and max lat and longitude
        if (location.longitude > this.maxLongitude){
            this.maxLongitude = location.longitude;
        }

        if (location.longitude < this.minLongitude){
            this.minLongitude = location.longitude;
        }

        if (location.latitude > this.maxLatitude){
            this.maxLatitude = location.latitude;
        }

        if (location.latitude < this.minLatitude){
            this.minLatitude = location.latitude;
        }

        // Add the stop to the array
        this.points.push(locationID);
    }

    /**
     * Determines if the current object is equal to another Path object
     * @param {Path} path Another path object
     */
    equals(path){

        // Check the bounding box
        if (path.maxLatitude != this.maxLatitude)
            return false;
        if (path.minLatitude != this.minLatitude)
            return false;
        if (path.maxLongitude != this.maxLongitude)
            return false;
        if (path.minLongitude != this.minLongitude)
            return false;

        // Check the points
        if (this.points.length != path.points.length)
            return false;

        for (let i = 0; i < this.points.length; i++){
            var curPt = this.points[i];
            var otherPt = path.points[i];

            if (curPt.locationID === otherPt.locationID)
                return false;
        }
        return true;
    }
}

module.exports = Path;
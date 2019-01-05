const rtree = require("rbush");
const knn = require("rbush-knn");

const Location = require("./location");
const Geography = require("./geography");
const Vector = require("./vector");

/**
 * A class used to represent a bag of locations in a path
 * for high performance querying and searching.
 */
class PathLocationBag{

    /**
     * Constructs a new PathLocationBag object.
     * Note that the jsonTreeData parameter is optional; if not set it will
     * create an empty PathLocationBag.
     * 
     * Pre-condition: The jsonTreeData must be the exact JSON representation of a PathLocationBag
     *  that was once made with this class and has called getJson().
     * 
     * @param {String} jsonTreeData The JSON data representation of a 
     *  tree after it was called from the getJson() method.
     */
    constructor(jsonTreeData){
        if (jsonTreeData){
            this._tree = rtree(16).fromJSON(jsonTreeData);
        }
        else{
            this._tree = rtree(16);
        }
    }

    /**
     * Creates an object representation of a location object that is used
     * to store in this bag.
     * @param {Location} location A location object
     * @return {Payload} The object representation of the location object
     */
    _createPayload(location){
        var latitude = location.latitude;
        var longitude = location.longitude;

        // We need to scale the latitude and longitude so that the rtree is more accurate
        var sLatitude = parseInt(latitude * 1000000, 10);
        var sLongitude = parseInt(longitude * 1000000, 10);

        // We want to make a 6m * 6m bounding box for our position
        var minLongitude = sLongitude - 6;
        var maxLongitude = sLongitude + 6;
        var minLatitude = sLatitude - 6;
        var maxLatitude = sLatitude + 6;

        // Create the payload to be added to the tree
        var payload = {
            minX: minLongitude,
            maxX: maxLongitude,
            minY: minLatitude,
            maxY: maxLatitude
        };

        // Add additional properties to the payload from location
        for (var key in location){
            if (key != latitude && key != longitude){
                payload[key] = location[value];
            }
        }

        return payload;
    }

    /**
     * Returns the Location object representation of a payload
     * @param {Payload} payload The payload
     * @return {Location} The location representation of a payload.
     */
    _convertPayloadToLocation(payload){
        var sLongitude = (payload.minX + payload.maxX) / 2;
        var sLatitude = (payload.minY + payload.maxY) / 2;

        var longitude = sLongitude / 1000000;
        var latitude = sLatitude / 1000000;
        var location = new Location(latitude, longitude);

        for(var key in payload) {
            var value = payload[key];

            if (key != "minX" && key != "maxX" && key != "minY" && key != "maxY"){
                location[key] = value;
            }
        }
        return location;
    }

    /**
     * Add a single location in the bag
     * @param {Location} location A location to add to the bag
     */
    addLocation(location){
        var payload = this._createPayload(location);
        this._tree.insert(payload);
    }

    /**
     * Add a list of locations in this bag
     * @param {Location[]} locations A list of locations
     */
    addLocations(locations){
        var payloads = [];
        locations.array.forEach(location => {
            var payload = this._createPayload(location);
            payloads.push(payload);
        });

        this._tree.load(payloads);
    }

    /**
     * Get the exact location in this bag,
     * If no such location is found, it will return null.
     * @param {Location} location A location
     * @return {Location} The location object in this bag.
     */
    getLocation(location){
        var latitude = location.latitude;
        var longitude = location.longitude;

        // We need to scale the latitude and longitude so that the rtree is more accurate
        var sLatitude = parseInt(latitude * 1000000, 10);
        var sLongitude = parseInt(longitude * 1000000, 10);

        var neighbors = knn(tree, sLongitude, sLatitude, 1, (payload) => {
            var sLatitude_Payload = (payload.minY + payload.maxY) / 2;
            var sLongitude_Payload = (payload.minX + payload.maxX) / 2;
            return sLatitude_Payload == sLatitude && sLongitude_Payload == sLongitude;
        });
        return neighbors[0];
    }

    /**
     * Get the closest location from the list of locations in this bag.
     * @param {Location} location The location to compare to
     * @return {Location} The closest location
     */
    getNearestLocation(location){
        var location2Vector = new Vector(location.longitude, location.latitude);

        // Due to a bug with the library, it will need to take the top 10 closest points 
        // and perform comparisons to see which one is the closest.
        var topTenLocations = this.getNearestLocations(location, 10);

        var closestLocation = null;
        var closestDistance = Number.MAX_VALUE;
        for (let i = 0; i < topTenLocations.length; i++){
            var topLocation = topTenLocations[i];
            var location1Vector = new Vector(topLocation.longitude, topLocation.latitude);
            
            var curDistance = Geography.calculateDistance(location1Vector, location2Vector);
            if (curDistance < closestDistance){
                closestDistance = curDistance;
                closestLocation = topLocation;
            }
        }    
        return closestLocation;
    }

    /**
     * Get the closest <code>amount</code> location(s) from this bag. 
     * @param {Location} location The location
     * @param {Number} amount The number of close locations
     * @return {Location[]} A list of <code>amount</code> closest locations.
     */
    getNearestLocations(location, amount){
        var sLatitude = location.latitude * 1000000;
        var sLongitude = location.longitude * 1000000;
        var nearestPts = knn(this._tree, sLongitude, sLatitude, amount);

        var locations = [];
        nearestPts.forEach(pt => {
            var location = this._convertPayloadToLocation(pt);
            locations.push(location);
        });
        return locations;
    }

    /**
     * Returns a list of path locations stored in this bag.
     * Note that it will not list them in order!
     * @return {Location[]} A list of path locations
     */
    getAllLocations(){
        var payloads = this._tree.all();
        var locations = [];
        payloads.forEach(payload => {
            var location = this._convertPayloadToLocation(payload);
            locations.push(location);
        });
        return locations;
    }

    /**
     * Returns the JSON representation of this class.
     */
    getJson(){
        return this._tree.toJSON();
    }
}

module.exports = PathLocationBag;
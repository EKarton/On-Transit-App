"use strict";

const Location = require("./location");

/**
 * A class used to store and retrieve locations uniquely.
 * Each time you add a location, you need to obtain its ID
 * so that you can obtain it back from the collection.
 */
class LocationBag{

    /**
     * Constructs a new LocationBag object
     */
    constructor(){
        this._locationIDToLocations = {};
        this._isEmpty = true;
        this._numElements = 0;
    }

    /**
     * Adds a location to the collection if the location is not 
     * in the collection yet.
     * If the location is in the collection already, it will return 
     * the location ID of the location already in the collection.
     * @param {Location} location A location to add to the collection
     * @return {string} The location ID.
     */
    addLocation(location){
        var locationID = this._getLocationID(location);
        if (this._locationIDToLocations[locationID] == undefined){
            this._locationIDToLocations[locationID] = location;
            this._numElements ++;
        }

        this._isEmpty = false;
        return locationID;
    }

    /**
     * Returns the location object associated with that ID.
     * If no location object is found with that ID it will return undefined.
     * @param {string} locationID The location ID
     */
    getLocation(locationID){
        return this._locationIDToLocations[locationID];
    }

    getStoredLocations(){
        return this._locationIDToLocations;
    }

    /**
     * Returns true if it is empty; else false.
     * @return {boolean} Returns true if it is empty; else false.
     */
    isEmpty(){
        return this._isEmpty;
    }

    /**
     * Returns the number of locations stored in the collection.
     * @return {number} The number of locations stored in the collection.
     */
    size(){
        return this._numElements;
    }

    /**
     * Computes the ID of a location based on the data in it.
     * The ID computed is unique to the data stored in the location.
     * If two IDs are the same, then the locations representing the IDs
     * must be the same.
     * @param {Location} location The location to compute the ID from
     * @return {string} The location ID
     */
    _getLocationID(location){
        var locationID = location.latitude + "," + location.longitude;
        locationID = locationID.replace(".", "_").replace(".", "_");
        return locationID;
    }
}

module.exports = LocationBag;
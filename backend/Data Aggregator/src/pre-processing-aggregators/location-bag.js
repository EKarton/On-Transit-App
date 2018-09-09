"use strict";

const Location = require("./../common/location");
const Database = require("./../common/database");

class LocationBag{
    /**
     * Initializes the LocationBag with access to the LocationBag's database
     * @param {Database} database Database to the location bag
     * @param {string} collectionName Name of the collection in the database
     */
    constructor(database, collectionName){
        this._database = database;
        this._collectionName = collectionName;
    }

    /**
     * Adds a location to the collection if the location is not 
     * in the collection yet.
     * If the location is in the collection already, it will return 
     * the location ID of the location already in the collection.
     * @param {Location} location A location to add to the collection
     * @return {string} The location ID.
     */
    async addLocation(location){
        var locationID = this._getLocationID(location);
        var existingObject = await this._database.getObject(this._collectionName, { "_id": locationID });

        // If the object doesnt exist yet add it to the database
        if (existingObject == null){
            var newDatabaseObject = {
                _id: locationID,
                latitude: location.latitude,
                longitude: location.longitude
            };

            await this._database.saveObjectToDatabase(this._collectionName, newDatabaseObject);
        }
        return locationID;
    }

    /**
     * Returns the location object associated with that ID.
     * If no location object is found with that ID it will return undefined.
     * @param {string} locationID The location ID
     * @return {Location} The location with that location ID; else undefined.
     */
    async getLocation(locationID){
        var existingObject = await this._database.getObject(this._collectionName, { "_id": locationID });
        if (existingObject == null)
            return undefined;

        var objectToReturn = {
            latitude: existingObject.latitude,
            longitude: existingObject.longitude
        };
        return objectToReturn;
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
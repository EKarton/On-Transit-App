"use strict";

const MongoClient = require('mongodb').MongoClient;

class Database {

    constructor() {
        this._databaseUrl = "";
        this._databaseName = "";
    }

    get databaseUrl() {
        return this._databaseUrl;
    }

    connectToDatabase(mongoDbUrl) {
        this._databaseUrl = mongoDbUrl;
        return new Promise((resolve, reject) => {

            MongoClient.connect(mongoDbUrl, { poolSize: 10 }, (error, client) => {
                if (error) {
                    console.log("Failed to connect to database!");
                    console.log(error);
                    reject(error);
                    return;
                }

                this._client = client;
                console.log("Connected to database!");

                resolve();
            });
        });
    }

    findNearestTransitAgencies(latitude, longitude) {
        return this._client.db("transits").collection("bounding_boxes").find({
            location: {
                $geoIntersects: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    }
                }
            }
        });
    }

    getTransitInfo(transitID) {
        return this._client.db("transits").collection("transits").findOne({ "transit_id": transitID });
    }

    findTripsFromPathID(databaseName, pathID) {
        return this._client.db(databaseName).collection("trips").find({
            "path_id": pathID
        });
    }

    findNearestPaths(databaseName, latitude, longitude, radius) {
        return this._client.db(databaseName).collection("paths").find({
            location: {
                $nearSphere: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: radius
                }
            }
        });
    }

    findSchedules(databaseName, tripID, time) {
        return this._client.db(databaseName).collection("schedules").find({
            $and: [
                { trip_id: { $eq: tripID } },
                { start_time: { $lte: time } },
                { end_time: { $gte: time } }
            ]
        });
    }

    findStopLocation(databaseName, stopID) {
        return this._client.db(databaseName).collection("stop_locations").findOne({ "stop_id": stopID });
    }

    closeDatabase() {
        return new Promise((resolve, reject) => {
            if (this._client) {
                this._client.close((error, result) => {
                    if (error)
                        reject(error);
                    else {
                        console.log("Database successfully closed connection");
                        resolve(result);
                    }
                });
            }
            else {
                console.log("Database connection already closed");
                resolve();
            }
        });
    }
}

module.exports = Database;
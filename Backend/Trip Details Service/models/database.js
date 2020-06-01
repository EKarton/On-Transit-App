"use strict";

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

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

    getTransit(transitID) {
        return this._client.db("transits").collection("transits").findOne({ "_id": new ObjectID(transitID) });
    }

    getTrip(databaseName, tripID) {
        return this._client.db(databaseName).collection("trips").findOne({ "trip_id": tripID });
    }

    getPath(databaseName, pathID) {
        return this._client.db(databaseName).collection("paths").findOne({ "path_id": pathID });
    }

    getSchedule(databaseName, scheduleID) {
        return this._client.db(databaseName).collection("schedules").findOne({ "_id": new ObjectID(scheduleID) });
    }

    getStopLocation(databaseName, stopID) {
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
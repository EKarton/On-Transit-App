"use strict";

const EventEmitter = require("events").EventEmitter;
const MongoClient = require('mongodb').MongoClient;

class Database{

    connectToDatabase(mongoDbUrl, databaseName){
        return new Promise((resolve, reject) => {
            MongoClient.connect(mongoDbUrl, { server: { 
                // sets how many times to try reconnecting
                reconnectTries: Number.MAX_VALUE,
                // sets the delay between every retry (milliseconds)
                reconnectInterval: 1000 
                } 
            }, (error, db) => {
                if (error){
                    reject(error);
                }
                else{
                    this._db = db;
                    this._dbo = db.db(databaseName);

                    resolve();
                }
            });
        });
    }

    getObject(collectionName, query){
        return this._dbo.collection(collectionName).findOne(query);
    }

    getObjects(collectionName, query){
        return this._dbo.collection(collectionName).find(query);
    }

    closeConnection(){
        return new Promise((resolve, reject) => {
            this._db.close((error, result) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
    }
}

module.exports = Database;
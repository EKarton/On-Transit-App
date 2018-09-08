"use strict";

const MongoClient = require('mongodb').MongoClient;

class Database{

    connectToDatabase(mongoDbUrl, databaseName){
        return new Promise((resolve, reject) => {
            var settings = { server: { 
                // sets how many times to try reconnecting
                reconnectTries: Number.MAX_VALUE,
                // sets the delay between every retry (milliseconds)
                reconnectInterval: 1000 
                } 
            };

            MongoClient.connect(mongoDbUrl, settings, (error, db) => {
                if (error){
                    reject(error);
                    return;
                }

                this._db = db;
                this._dbo = db.db(databaseName);

                resolve();
            });
        });
    }

    createCollectionInDatabase(collectionName){
        return new Promise((resolve, reject) => {
            this._dbo.createCollection(collectionName, (error, response) => {
                if (error)
                    reject(error);

                resolve();
            });
        })
    }

    saveArrayToDatabase(collectionName, objects){
        return new Promise((resolve, reject) => {
            this._dbo.collection(collectionName).insertMany(objects, (error, response) => {
                if (error)
                    reject(error);
                resolve();
            });
        });   
    }

    saveObjectToDatabase(collectionName, object){
        return new Promise((resolve, reject) => {
            this._dbo.collection(collectionName).insertOne(object, (error, response) => {
                if (error)
                    reject(error);
                resolve();
            });
        });
    }

    updateObject(collectionName, query, newValues){
        return new Promise((resolve, reject) => {
            this._dbo.collection(collectionName).updateOne(query, newValues, (error, response) => {
                if (error){
                    reject(error);
                }
                else{
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

    closeDatabase(){
        return new Promise((resolve, reject) => {
            if (this._db){
                this._db.close((error, result) => {
                    if (error)
                        reject(error);
                    else{
                        console.log("Database successfully closed connection");
                        resolve(result);
                    }
                });
            }
            else{
                console.log("Database connection already closed");
                resolve();
            }
        });
    }
}

module.exports = Database;
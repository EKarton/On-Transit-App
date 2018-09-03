"use strict";

const MongoClient = require('mongodb').MongoClient;

class Database{

    connectToDatabase(mongoDbUrl, databaseName){
        return new Promise((resolve, reject) => {
            MongoClient.connect(mongoDbUrl, (error, db) => {
                if (error)
                    reject(error);

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

    closeDatabase(){
        return this._db.close();
    }
}

module.exports = Database;
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

            this._cache = {};

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
        // return new Promise(async (resolve, reject) => {
        //     // var cacheID = JSON.stringify(query) + ",_collectionName=" + collectionName;
        //     // var cacheResult = this._cache[cacheID];

        //     // if (!cacheResult){
        //     //     var result = await this._dbo.collection(collectionName).findOne(query);
        //     //     this._cache[cacheID] = result;

        //     //     resolve(result);
        //     // }
        //     // else{
        //     //     resolve(cacheResult);
        //     // }
        // });
        return this._dbo.collection(collectionName).findOne(query);
    }

    getObjects(collectionName, query){
        return this._dbo.collection(collectionName)
                .find(query)
                .batchSize(200);
        // return new Promise((resolve, reject) => {
        //     var cursor = this._dbo.collection(collectionName)
        //         .find(query);
        //         //.addCursorFlag('noCursorTimeout', true)
        //         //.batchSize(200);

        //     var safeCursor = {
        //         _cursor: cursor,
        //         hasNext: async function(){
        //             try{
        //                 var result = await this._cursor.hasNext();
        //                 if (!result && !this._cursor.isClosed()){
        //                     await this._cursor.close();
        //                 }
        //                 return result;
        //             }
        //             catch(error){
        //                 console.log("I AM HERERERERERER");
        //                 await this._cursor.close();
        //                 throw error;
        //             }
        //         },
        //         next: async function(){
        //             try{
        //                 var result = await this._cursor.next();
        //                 return result;
        //             }
        //             catch(error){
        //                 await this._cursor.close();
        //                 throw error;
        //             }
        //         }
        //     };
        //     resolve(safeCursor);
        // });
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
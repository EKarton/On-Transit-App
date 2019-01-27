"use strict";

const MongoClient = require('mongodb').MongoClient;

class Database{

    constructor(){
        this._databaseUrl = "";
        this._databaseName = "";
    }

    get databaseUrl(){
        return this._databaseUrl;
    }

    get databaseName(){
        return this._databaseName;
    }

    connectToDatabase(mongoDbUrl, databaseName){
        this._databaseUrl = mongoDbUrl;
        this._databaseName = databaseName;
        return new Promise((resolve, reject) => {
            var settings = { server: { 
                // sets how many times to try reconnecting
                reconnectTries: Number.MAX_VALUE,
                // sets the delay between every retry (milliseconds)
                reconnectInterval: 1000 
                } 
            };

            this._cache = {};

            MongoClient.connect(mongoDbUrl, {poolSize: 10}, (error, db) => {
                if (error){
                    console.log("Failed to connect to database!");
                    console.log(error);
                    reject(error);
                    return;
                }

                this._db = db;
                this._dbo = db.db(databaseName);
                console.log("Connected to database!");

                resolve();
            });
        });
    }

    getInstance(){
        return this._dbo;
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
            this._dbo.collection(collectionName).insertMany(objects, (error, documentInserted) => {
                if (error)
                    reject(error);
                resolve(documentInserted);
            });
        });   
    }

    saveObjectToDatabase(collectionName, object){
        return new Promise((resolve, reject) => {
            this._dbo.collection(collectionName).insertOne(object, (error, documentInserted) => {
                if (error)
                    reject(error);
                resolve(documentInserted);
            });
        });
    }

    updateObject(collectionName, query, newValues){
        return new Promise((resolve, reject) => {
            try{
            	this._dbo.collection(collectionName).updateOne(query, newValues);
            	resolve();
        	}
        	catch(error){
        		reject(error);
        	}
        });
    }

    updateObjects(collectionName, query, newValues){
    	return new Promise((resolve, reject) => {
    		try{
            	this._dbo.collection(collectionName).updateMany(query, newValues);
            	resolve();
        	}
        	catch(error){
        		reject(error);
        	}
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
                .batchSize(500);
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

    getAggregatedObjects(collectionName, aggregationQuery){
        return this._dbo.collection(collectionName)
            .aggregate(aggregationQuery)
            .batchSize(500);
    }

    removeObject(collectionName, query){
    	return new Promise((resolve, reject) => {
    		this._dbo.collection(collectionName).deleteOne(query, (error, object) => {
    			if (error){
    				reject(error);
    			}
    			resolve(object);
    		});
    	});
    }

    removeObjects(collectionName, query){
    	return new Promise((resolve, reject) => {
    		this._dbo.collection(collectionName).deleteMany(query, (error, object) => {
    			if (error){
    				reject(error);
    			}
    			resolve(object);
    		});
    	});
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
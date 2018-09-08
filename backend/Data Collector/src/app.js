const Database = require("./database");
const DataCollector = require("./data-collector");

const MONGODB_URL = "mongodb://localhost:27017/";
const DATABASE_NAME = "miway-gtfs-static-data";


async function main(){
    var database = null;
    try{
        database = new Database();
        await database.connectToDatabase(MONGODB_URL, DATABASE_NAME);

        var collector = new DataCollector();
        await collector.clearFolder();
        await collector.downloadAndExtractGtfsData("https://www.miapp.ca/GTFS/google_transit.zip");
        await collector.saveFilesToDatabase(database);
    }
    catch(error){
        if (database)
            database.closeDatabase();
        throw error;
    }
}

main();
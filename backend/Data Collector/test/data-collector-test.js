const Database = require("./../src/database");
const DataCollector = require("./../src/data-collector");

const MONGODB_URL = "mongodb://localhost:27017/";
const DATABASE_NAME = "miway-gtfs-static-data";

const assert = require("assert");

describe("ALL", () => {
    it("should store all data to db", async () => {
        var database = null;
        try{
            database = new Database();
            await database.connectToDatabase(MONGODB_URL, DATABASE_NAME);

            var collector = new DataCollector();
            await collector.clearFolder();
            await collector.downloadAndExtractGtfsData("https://www.miapp.ca/GTFS/google_transit.zip");
            await collector.saveFilesToDatabase(database);

            database.closeDatabase();
            assert.ok(true);
        }
        catch(error){
            if (database)
                database.closeDatabase();
            assert.fail(error);
        }
    }).timeout(500000);
});
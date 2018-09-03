const DataCollector = require("../src/data-collector");
const assert = require("assert");

describe("ALL", () => {
    it("should store all data to db", async () => {
        var collector = new DataCollector();

        try{
            await collector.clearFolder();
            await collector.downloadAndExtractGtfsData("https://www.miapp.ca/GTFS/google_transit.zip");
            await collector.saveFilesToDatabase();

            // This is a bug with asynchronous methods where you need 
            // this to tell Mocha that the test is done.
            assert.ok(true); 
        }
        catch(error){
            assert.fail(error);
        }
    }).timeout(500000);
});
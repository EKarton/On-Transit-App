const assert = require("assert");
const fs = require("fs");

const Database = require("../src/database");
const TripDataService = require("../src/trip-data-service");

describe("TripDataService.getTripData()", () => {
    it("should return data of trip number 17283382", async () => {
        try{
            var database = new Database();
            await database.connectToDatabase("mongodb://localhost:27017/", "miway-gtfs-static-data");

            var tripDataService = new TripDataService(database);
            var results = await tripDataService.getTripData("17283382");

            fs.writeFileSync("tmp/tripData.json", JSON.stringify(results));
            database.closeConnection();
            assert.ok(true);
        }
        catch(error){
            if (database)
                database.closeConnection();
            assert.fail(error);
        }
    }).timeout(5000);
})
const assert = require("assert");
const fs = require("fs");

const Database = require("../src/database");
const TripsLocator = require("../src/trips-locator");

describe("TripsLocator.getTripIDsNearLocation()", () => {
    it("should return the trip IDs around Winston Churchill and Erin Center Blvd", async () => {
        var database = null;
        try{
            var database = new Database();
            await database.connectToDatabase("mongodb://localhost:27017/", "miway-gtfs-static-data");

            var tripsLocator = new TripsLocator(database);
            var results = await tripsLocator.getTripIDsNearLocation(43.553040, -79.722790, 50, 50000);

            fs.writeFileSync("tmp/tripsNearMe.json", JSON.stringify(results));
            database.closeConnection();
            assert.ok(true);
        }
        catch(error){
            if (database)
                database.closeConnection();
            assert.fail(error);
        }
    }).timeout(500000);
});
const assert = require("assert");
const fs = require("fs");

const Database = require("../src/database");
const PathsLocator = require("../src/paths-locator");

describe("PathsLocator.getPathIDsNearLocation()", () => {
    it("should return the paths around Winston Churchill and Erin Center Blvd", async () => {
        var database = null;
        try{
            var database = new Database();
            await database.connectToDatabase("mongodb://localhost:27017/", "miway-gtfs-static-data");

            var pathsLocator = new PathsLocator(database);
            var results = await pathsLocator.getPathIDsNearLocation(43.553040, -79.722790, 50);
            console.log(pathsLocator.amount);

            fs.writeFileSync("tmp/pathsNearMe.json", JSON.stringify(results));
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
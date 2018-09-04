const assert = require("assert");
const fs = require("fs");

const RoutesLocator = require("../src/routes-locator");
const Vector = require("./../src/vector");
const Circle = require("./../src/circle");

describe("wasd", () => {
    it("wasd", async () => {
        try{
            var locator = new RoutesLocator();
            
            // The GPS location is at Winston Churchill and Erin Center Blvd
            var results = await locator.getRoutesNearLocation(43.553040, -79.722790, 50);
            fs.writeFileSync("tmp/routesNearMe.json", JSON.stringify(results));
            assert.ok(true);
        }
        catch(error){
            assert.fail(error);
        }
    }).timeout(500000);
});
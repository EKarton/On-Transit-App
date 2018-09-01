const assert = require("assert");
const fs = require("fs");
const TransitFeedService = require("./../src/transit-feed-service");

describe("getNearbyVehiclesByLocation()", () => {
    it("simple test", (done) => {
        var service = new TransitFeedService();
        service.getNearbyVehiclesByLocation(43.554029, -79.722100, 5000)
            .then(results => {
                console.log(results);
                fs.writeFileSync("results.json", JSON.stringify(results));
                console.log(results.length);
                done();
            }).catch(error => {
                console.log(error);
                done();
            });
    }).timeout(5000);
});

/**
 * The data should look like:
 * [R143243: {
 *  routeInfo: ...
 *  path: [(lat, long)
 *    
 *  ]
 * }]
 */

describe("getNearbyRoutesByLocation()", () => {
    it("simple test", (done) => {
        var service = new TransitFeedService();
        service.getNearbyRoutesByLocation(43.554029, -79.722100, 50)
            .then(result => {
                fs.writeFileSync("results.json", JSON.stringify(result));
                console.log("DONE");
                done();
            }).catch(error => {
                console.log("ERROR!");
                console.log(error);
                assert.fail(error);
                done();
            });
    }).timeout(500000);
});

describe("_getShapes()", () => {
    it("simple test", (done) => {
        var service = new TransitFeedService();
        service._getShapes("src/miway-gfts-files/shapes.txt")
            .then((results) => {
                fs.writeFileSync("shapes.json", JSON.stringify(results));
                done();
            }).catch(error => {
                assert.fail(error);
                done();
            });
    }).timeout(5000000);
});

describe("_getRoutes()", () => {
    it("simple test", (done) => {
        var service = new TransitFeedService();
        service._getRoutes("src/miway-gfts-files/routes.txt")
            .then((results) => {
                console.log(results);
                done();
            }).catch(error => {
                assert.fail(error);
                done();
            });
    }).timeout(5000);
});
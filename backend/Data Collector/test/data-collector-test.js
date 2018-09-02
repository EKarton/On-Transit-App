const assert = require("assert");
const fs = require("fs");
const DataCollector = require("./../src/data-collector");

describe("downloadAndExtractGtfsData()", () => {
    it("should download miway content", done => {
        var service = new DataCollector();
        service.downloadAndExtractGtfsData("https://www.miapp.ca/GTFS/google_transit.zip")
            .then(() => {
                done();
            })
            .catch(error => {
                console.log("ERROR!" + error);
                assert.fail(error);
                done();
            })
    }).timeout(5000);
});

describe("parseTrips()", () => {
    it("shoud parse trips", (done) => {
        var service = new DataCollector();
        service.parsePaths("tmp/extracted-gtfs-static-files/shapes.txt")
            .then(pathResults => {
                service.parseRoutes("tmp/extracted-gtfs-static-files/routes.txt")
                    .then(routeResults => {
                        service.parseTrips("tmp/extracted-gtfs-static-files/trips.txt")
                            .then(tripResults => {
                                fs.writeFileSync("tmp/parseUniqueTrips.json", JSON.stringify(tripResults.uniqueTrips));
                                fs.writeFileSync("tmp/parseTripMappings.json", JSON.stringify(tripResults.tripIDsToUniqueTripIDs));
                                done();
                            })
                            .catch(tripError => {
                                assert.fail("ERROR IN GETTING TRIPS!, " + tripError);
                                done();
                            });
                    })
                    .catch(routeError => {
                        assert.fail("ERROR IN GETTING ROUTES!, " + routeError);
                        done();
                    });
            })
            .catch(pathError => {
                assert.fail("ERROR IN GETTING PATHS!, " + pathError);
                done();
            })
    }).timeout(500000);
});

describe("parseStops()", () => {
    it("should parse stops", done => {
        var service = new DataCollector();
        service.parseStops("tmp/extracted-gtfs-static-files/stops.txt")
            .then(result => {
                fs.writeFileSync("tmp/parseStopLocations.json", JSON.stringify(result.stopLocations));
                fs.writeFileSync("tmp/parseStops.json", JSON.stringify(result.uniqueStops));
                fs.writeFileSync("tmp/parseStopIDMappings.json", JSON.stringify(result.stopIDsToUniqueStopIDs));
                done();
            })
            .catch(error => {
                console.log("ERROR!" + error);
                assert.fail(error);
                done();
            });
    }).timeout(5000);
})

describe("parsePaths()", () => {
    it("should parse paths", done => {
        var service = new DataCollector();
        service.parsePaths("test/test-data/duplicated-shapes.txt")
            .then(result => {
                fs.writeFileSync("tmp/parsePaths.json", JSON.stringify(result));
                done();
            })
            .catch(error => {
                console.log("ERROR!" + error);
                assert.fail(error);
                done();
            })
    }).timeout(50000);
});

describe("parseRoutes()", () => {
    it("should parse routes", done => {
        var service = new DataCollector();
        service.parseRoutes("tmp/extracted-gtfs-static-files/routes.txt")
            .then(result => {
                fs.writeFileSync("tmp/parsedRoutes.json", JSON.stringify(result));
                done();
            })
            .catch(error => {
                console.log("ERROR!" + error);
                assert.fail(error);
                done();
            })
    }).timeout(50000);
});
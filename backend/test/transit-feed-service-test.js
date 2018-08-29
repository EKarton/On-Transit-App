const assert = require("assert");
const TransitFeedService = require("./../src/transit-feed-service");

// describe("getNearbyVehiclesByLocation()", () => {
//     it("simple test", (done) => {
//         var service = new TransitFeedService();
//         service.getNearbyVehiclesByLocation(43.554029, -79.722100, 500)
//             .then(results => {
//                 console.log(results);
//                 console.log(results.length);
//                 done();
//             }).catch(error => {
//                 console.log(error);
//                 done();
//             });
//     }).timeout(5000);
// });

// describe("getNearbyRoutesByLocation()", () => {
//     it("simple test", (done) => {
//         var service = new TransitFeedService();
//         service.getNearbyRoutesByLocation(43.554029, -79.722100, 500)
//             .then(() => {
//                 done();
//             }).catch(error => {
//                 assert.fail(error);
//                 done();
//             });
//     }).timeout(5000);
// });

// describe("_getShapes()", () => {
//     it("simple test", (done) => {
//         var service = new TransitFeedService();
//         service._getShapes("src/miway-gfts-files/shapes.txt")
//             .then((results) => {
//                 done();
//             }).catch(error => {
//                 assert.fail(error);
//                 done();
//             });
//     }).timeout(5000000);
// });

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
const assert = require("assert");
const TransitFeedService = require("./../src/transit-feed-service");

describe("getNearbyVehiclesByLocation()", () => {
    it("simple test", (done) => {
        var service = new TransitFeedService();
        service.getNearbyVehiclesByLocation(43.554029, -79.722100, 500)
            .then(function(results){
                console.log(results);
                console.log(results.length);
                done();
            }).catch(error => {
                console.log(error);
                done();
            });
    }).timeout(5000);
});

describe("getNearbyTripsByLocation()", () => {

});
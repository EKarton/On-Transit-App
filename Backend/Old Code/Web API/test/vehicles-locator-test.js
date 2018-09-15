const assert = require("assert");
const fs = require("fs");

const VehiclesLocator = require("../src/vehicles-locator");
const Vector = require("../src/vector");
const Circle = require("../src/circle");

describe("VehicleLocator.constructor()", () => {
    it("should store the default value", () => {
        var vehicleLocator = new VehiclesLocator();
        var expectedUrl = "https://www.miapp.ca/GTFS_RT/Vehicle/VehiclePositions.pb";
        assert.ok(vehicleLocator.gtfsUrl === expectedUrl);
    });

    it("should change the gtfs url", () => {
        var url = "http://nextride.brampton.ca:81/API/VehiclePositions?format=gtfs.proto";
        var vehicleLocator = new VehiclesLocator(url);
        assert.ok(vehicleLocator.gtfsUrl === url);
    });
});

describe("VehicleLocator._getVehicles()", () => {
    it("should get the raw data of vehicles", async () => {
        try{
            var url = "https://www.miapp.ca/GTFS_RT/Vehicle/VehiclePositions.pb";
            var vehicleLocator = new VehiclesLocator(url);

            var vehicles = await vehicleLocator._getVehicles();
            fs.writeFileSync("tmp/vehicles.json", JSON.stringify(vehicles));
            assert.ok(vehicles.length > 0);
        }
        catch(error){
            assert.fail(error);
        }
    });
});

describe("VehicleLocator._isVehicleInGeofence()", () => {
    it("should return true", () => {
        var url = "https://www.miapp.ca/GTFS_RT/Vehicle/VehiclePositions.pb";
        var vehicleLocator = new VehiclesLocator(url);

        var vehicle = {
            tripID: "1234567",
            position: new Vector(-50, -49)
        };

        var geofence1 = new Circle(new Vector(-30, -60), 1766000);
        var geofence2 = new Circle(new Vector(-30, -60), 1765000)

        assert.equal(vehicleLocator._isVehicleInGeofence(vehicle, geofence1), true);
        assert.equal(vehicleLocator._isVehicleInGeofence(vehicle, geofence2), false)
    });
});

describe("VehicleLocator.getNearbyVehiclesByLocation()", () => {
    it("should return vehicles near the current location", async () => {
        var url = "https://www.miapp.ca/GTFS_RT/Vehicle/VehiclePositions.pb";
        var vehicleLocator = new VehiclesLocator(url);

        try{
            var nearbyVehicles = await vehicleLocator.getNearbyVehiclesByLocation(43.554028, -79.722099, 5000);
            fs.writeFileSync("tmp/vehiclesNearMe.json", JSON.stringify(nearbyVehicles));
            assert.ok(true);
        }
        catch(error){
            assert.fail(error);
        }
    });
});
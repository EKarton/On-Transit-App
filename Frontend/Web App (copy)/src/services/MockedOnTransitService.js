import MockedTripDetails from "./mocked-data/MockedTripDetails-1";
import MockedNearbyVehicles from "./mocked-data/MockedNearbyVehicles";
import MockedNearbyTripsWithInfo from "./mocked-data/MockedNearbyTripsWithInfo";


export function getNearbyTrips(latitude, longitude, time, radius){
    return new Promise((resolve, reject) => {
        let data = MockedNearbyTripsWithInfo.data;
        resolve(data);
    });
}

export function getTripDetails(tripID){
    return new Promise((resolve, reject) => {
        let data = MockedTripDetails.data;
        resolve(data);
    });
}

export function getNearbyVehicles(latitude, longitude, radius){
    return new Promise((resolve, reject) => {
        let data = MockedNearbyVehicles.data;
        resolve(data);
    });
}

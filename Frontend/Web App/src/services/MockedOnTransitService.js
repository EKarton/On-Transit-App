import MockedTripDetails from "./mocked-data/MockedTripDetails";
import MockedNearbyVehicles from "./mocked-data/MockedNearbyVehicles";
import MockedNearbyTripsWithInfo from "./mocked-data/MockedNearbyTripsWithInfo";


class MockedOnTransitService {
    getNearbyTrips(latitude, longitude, time, radius){
        return new Promise((resolve, reject) => {
            let data = MockedNearbyTripsWithInfo.data;
            resolve(data);
        });
    }

    getTripDetails(tripID){
        return new Promise((resolve, reject) => {
            let data = MockedTripDetails.data;
            resolve(data);
        });
    }

    getNearbyVehicles(latitude, longitude, radius){
        return new Promise((resolve, reject) => {
            let data = MockedNearbyVehicles.data;
            resolve(data);
        });
    }
}


export default MockedOnTransitService;
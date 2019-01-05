import MockedTripDetails from "./MockedTripDetails";
import MockedNearbyVehicles from "./MockedNearbyVehicles";
import MockedNearbyTrips from "./MockedNearbyTrips";


class MockedOnTransitService {
    getNearbyTrips(latitude, longitude, time, radius){
        return new Promise((resolve, reject) => {
            let data = MockedNearbyTrips.data;
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
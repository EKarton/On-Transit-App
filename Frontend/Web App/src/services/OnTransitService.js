import Axios from "axios";
Axios.defaults.timeout = 180000;

console.log(process.env.REACT_APP_TRANSIT_API_SERVICE_URL);

export async function getNearbyTrips(latitude, longitude, time, radius) {
    try {
        let url = `${process.env.REACT_APP_TRANSIT_API_SERVICE_URL}/api/v1/trips`;
        let urlParams = {
            lat: latitude,
            long: longitude,
            time: time,
            radius: radius
        };
        let options = {
            params: urlParams
        };

        let rawData = await Axios.get(url, options);
        return rawData.data.data;
    }
    catch (error) {
        throw error;
    }
}

export async function getTripDetails(transitID, tripID, scheduleID) {
    try {
        let url = `${process.env.REACT_APP_TRANSIT_API_SERVICE_URL}/api/v1/transits/${transitID}/trips/${tripID}/schedules/${scheduleID}`;
        let rawData = await Axios.get(url);
        return rawData.data.data;
    }
    catch (error) {
        throw error;
    }
}

export async function getNearbyVehicles(latitude, longitude, radius) {
    throw new Error("Calling vehicles endpoint is depreciated!");
}

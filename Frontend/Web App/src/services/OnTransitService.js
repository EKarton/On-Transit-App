import Axios from "axios";
Axios.defaults.timeout = 180000;

// const TRIPS_LOCATOR_URL = "https://on-transit-app-api-gateway.herokuapp.com/api/v1/trips";
// const TRIP_DETAILS_URL = "https://on-transit-app-api-gateway.herokuapp.com/api/v1/trips";
// const VEHICLES_LOCATOR_URL = "https://on-transit-app-api-gateway.herokuapp.com/api/v1/vehicles";

const TRIPS_LOCATOR_URL = "http://localhost:5000/api/v1/trips";
const TRIP_DETAILS_URL = "http://localhost:5000/api/v1/trips";
const VEHICLES_LOCATOR_URL = "http://localhost:5000/api/v1/vehicles";

export async function getNearbyTrips(latitude, longitude, time, radius){
    try{
        let urlParams = {
            lat: latitude,
            long: longitude,
            time: time,
            radius: radius
        };
        let options = {
            params: urlParams
        };

        let rawData = await Axios.get(TRIPS_LOCATOR_URL, options);
        return rawData.data.data;
    }
    catch(error){
        throw error;
    }
}

export async function getTripDetails(tripID, scheduleID){
    try{
        let url = TRIP_DETAILS_URL + "/" + tripID + "/schedules/" + scheduleID;
        let rawData = await Axios.get(url);
        return rawData.data.data;
    }
    catch(error){
        throw error;
    }
}

export async function getNearbyVehicles(latitude, longitude, radius){
    try{
        let urlParams = {
            lat: latitude,
            long: longitude,
            radius: radius
        };
        let options = {
            params: urlParams
        };
        let rawData = await Axios.get(VEHICLES_LOCATOR_URL, options);
        return rawData.data.data;
    }
    catch(error){
        throw error;
    }
}

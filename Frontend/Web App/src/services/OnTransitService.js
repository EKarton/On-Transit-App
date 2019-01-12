import Axios from "axios";
Axios.defaults.timeout = 180000;

const TRIPS_LOCATOR_URL = "https://on-transit-app-trips-locator.herokuapp.com/api/v1/trips";
const TRIP_DETAILS_URL = "https://on-transit-app-api-gateway.herokuapp.com/api/v1/trips";
const VEHICLES_LOCATOR_URL = "https://on-transit-app-api-gateway.herokuapp.com/api/v1/vehicles";

class OnTransitService {

    async getNearbyTrips(latitude, longitude, time, radius){
        try{
            let urlParams = {
                lat: latitude,
                long: longitude,
                time: time,
                radius: radius
            };
            let options = {
                params: urlParams
            }
            let rawData = await Axios.get(TRIPS_LOCATOR_URL, options);
            console.log(rawData);
            return rawData.data.data;
        }
        catch(error){
            throw error;
        }
    }

    async getTripDetails(tripID){
        try{
            let url = TRIP_DETAILS_URL + "/" + tripID;
            let rawData = await Axios.get(url);
            return rawData.data.data;
        }
        catch(error){
            throw error;
        }
    }

    async getNearbyVehicles(latitude, longitude, radius){
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
}

export default OnTransitService;
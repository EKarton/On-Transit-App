import { types } from "../constants/nearby-trips-constants";

export function getNearbyTrips(latitude, longitude, time, radius){
    return {
        type: types.FETCH_NEARBY_TRIPS,
        payload: {
            latitude: latitude,
            longitude: longitude,
            time: time,
            radius: radius
        }
    };
}
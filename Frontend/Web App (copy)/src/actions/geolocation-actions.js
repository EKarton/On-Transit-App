import { types } from "../constants/geolocation-constants";

export function startTrackingLocation(){
    return {
        type: types.START_TRACKING_CURRENT_LOCATION
    };
}

export function stopTrackingLocation(){
    return {
        type: types.STOP_TRACKING_CURRENT_LOCATION
    };
}
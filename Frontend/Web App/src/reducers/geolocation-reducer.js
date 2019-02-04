import { createReducer } from "../utils/CreateReducer";
import { types } from "../constants/geolocation-constants";

const initialState = {
    latitude: 43.553178,
    longitude: -79.723189,
    radius: 0
};

const onLocationChanged = (state, { payload }) => {
    let newLatitude = payload.latitude;
    let newLongitude = payload.longitude;
    let radius = payload.radius;

    return {
        ...state,
        latitude: newLatitude,
        longitude: newLongitude,
        radius: radius
    };
};

export default createReducer(initialState, {
    [types.CURRENT_LOCATION_CHANGED]: onLocationChanged
});

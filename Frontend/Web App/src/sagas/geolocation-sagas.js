import { call, takeLatest } from "redux-saga/effects";
import { types } from "../constants/geolocation-constants";
import { stopLocationWatch, startLocationWatch } from "../services/GeolocationTracker";
import { store } from "../store/store";

function onLocationChangedSuccess(position){
    let latitude = position.coords.latitude;
    let longitude = position.coords.longitude;
    let radius = position.coords.accuracy;

    let payloadObj = {
        latitude: latitude,
        longitude: longitude,
        radius: radius
    };
    store.dispatch({type: types.CURRENT_LOCATION_CHANGED, payload: payloadObj});
}

function onLocationChangedError(error){
    console.error(error);
}

function* startTrackingLocation(){
    let watchCallbacks = {
        onSuccess: onLocationChangedSuccess,
        onError: onLocationChangedError
    };
    yield call(startLocationWatch, watchCallbacks);
}

function* stopTrackingLocation(){
    yield call(stopLocationWatch);
}

export default function*(){
    yield takeLatest(types.START_TRACKING_CURRENT_LOCATION, startTrackingLocation);
    yield takeLatest(types.STOP_TRACKING_CURRENT_LOCATION, stopTrackingLocation);
}
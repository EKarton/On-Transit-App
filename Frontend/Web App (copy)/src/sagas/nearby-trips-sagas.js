import { call, put, takeLatest } from "redux-saga/effects";
import { types } from "../constants/nearby-trips-constants";
import { getNearbyTrips as getNearbyTripsByAPI } from "../services/OnTransitService";

function* getNearbyTrips({ payload }){

    console.log(payload);

    let latitude = payload.latitude;
    let longitude = payload.longitude;
    let time = payload.time;
    let radius = payload.radius;

    yield put({type: types.FETCH_NEARBY_TRIPS_IN_PROGRESS });

    try{
        let result = yield call(getNearbyTripsByAPI, latitude, longitude, time, radius);
        yield put({type: types.FETCH_NEARBY_TRIPS_SUCCESS, payload: result });
    }
    catch(error){
        yield put({type: types.FETCH_NEARBY_TRIPS_FAILURE });
    }
}

export default function*(){
    yield takeLatest(types.FETCH_NEARBY_TRIPS, getNearbyTrips);
}
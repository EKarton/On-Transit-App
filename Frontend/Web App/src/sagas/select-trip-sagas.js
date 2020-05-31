import { call, put, takeLatest } from "redux-saga/effects";
import { types } from "../constants/select-trip-constants";
import { getTripDetails as getTripDetailsFromApi } from "../services/OnTransitService";

function* getTripDetails({ payload }){
    let transitID = payload.transitID;
    let tripID = payload.tripID;
    let scheduleID = payload.scheduleID;

    yield put({ type: types.FETCH_TRIP_DETAILS_IN_PROGRESS });

    try{
        let tripDetails = yield call(getTripDetailsFromApi, transitID, tripID, scheduleID);
        let payload = {
            tripDetails: tripDetails,
            transitID: transitID,
            tripID: tripID,
            scheduleID: scheduleID
        }
        yield put({ type: types.FETCH_TRIP_DETAILS_SUCCESS, payload: payload });
    }
    catch(error){
        yield put({ type: types.FETCH_TRIP_DETAILS_FAILURE, payload: error });
    }
}

export default function*(){
    yield takeLatest(types.FETCH_TRIP_DETAILS, getTripDetails);
}
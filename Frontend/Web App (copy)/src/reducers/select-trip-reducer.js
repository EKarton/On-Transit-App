import { createReducer } from "../utils/CreateReducer";
import { types } from "../constants/select-trip-constants";

const initialState = {
    inProgress: false,
    tripID: null,
    scheduleID: null,
    tripDetails: null
};

const onProgress = (state, { payload }) => {
    return {
        ...state,
        inProgress: true
    };
};

const onSuccess = (state, { payload }) => {
    return {
        ...state,
        inProgress: false,
        error: null,
        tripID: payload.tripID,
        scheduleID: payload.scheduleID,
        tripDetails: payload.tripDetails
    };
};

const onFailure = (state, { payload }) => {
    return {
        ...state,
        inProgress: false,
        error: payload.error
    }
};

export default createReducer(initialState, {
    [types.FETCH_TRIP_DETAILS_IN_PROGRESS]: onProgress,
    [types.FETCH_TRIP_DETAILS_SUCCESS]: onSuccess,
    [types.FETCH_TRIP_DETAILS_FAILURE]: onFailure
});
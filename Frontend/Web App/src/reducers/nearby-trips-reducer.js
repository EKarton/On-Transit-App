import { createReducer } from "../utils/CreateReducer";
import { types } from "../constants/nearby-trips-constants";

const initialState = {
    inProgress: true,
    tripIDs: {},
    error: null
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
        tripIDs: payload,
        error: null
    };
};

const onFailure = (state, { payload }) => {
    return {
        ...state,
        inProgress: false,
        tripIDs: {},
        error: payload
    };
};

export default createReducer(initialState, {
    [types.FETCH_NEARBY_TRIPS_IN_PROGRESS]: onProgress,
    [types.FETCH_NEARBY_TRIPS_SUCCESS]: onSuccess,
    [types.FETCH_NEARBY_TRIPS_FAILURE]: onFailure
});

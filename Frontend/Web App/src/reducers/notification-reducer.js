import { createReducer } from "../utils/CreateReducer";
import { types } from "../constants/notification-constants";

const initialState = {
    text: null,
    duration: 0
}

const dispatchNotification = (state, { payload }) => {
    let message = payload.message;
    let duration = payload.duration;

    return {
        ...state,
        text: message,
        duration: duration
    };
};

const removeNotification = (state, { payload }) => {
    return {
        text: null,
        duration: null
    };
};

export default createReducer(initialState, {
    [types.DISPATCH_NOTIFICATION]: dispatchNotification,
    [types.REMOVE_NOTIFICATION]: removeNotification
});

import { types } from "../constants/alarm-constants";

export const createAlarm = (time, dispatcher) => {
    return {
        type: types.CREATE_NEW_ALARM,
        payload: {
            time: time,
            dispatcher: dispatcher
        }
    };
}

export const deleteAlarm = (time) => {
    return {
        type: types.DELETE_ALARM,
        payload: {
            time: time
        }
    };
}

export const startAlarm = () => {
    return {
        type: types.START_ALARM
    };
}

export const stopAlarm = () => {
    return {
        type: types.STOP_ALARM
    };
}
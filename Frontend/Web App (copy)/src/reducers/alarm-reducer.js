import { 
    addAlarm, 
    deleteAlarm as deleteAlarmFromManager, 
    getAlarms, 
    startAlarm as startAlarmFromManager, 
    stopAlarm as stopAlarmFromManager 
} from "../services/AlarmsManager";
import { types } from "../constants/alarm-constants";
import { createReducer } from "../utils/CreateReducer";

const initialState = {
    alarms: {},
    isAlarmRunning: false
};

const createAlarm = (state, { payload }) => {
    let time = payload.time;
    let dispatcher = payload.dispatcher;
    addAlarm(time, dispatcher);

    return {
        ...state,
        alarms: getAlarms()
    };
};

const deleteAlarm = (state, { payload }) => {
    let time = payload.time;
    let dispatcher = payload.dispatcher;
    deleteAlarmFromManager(time, dispatcher);

    return {
        ...state,
        alarms: getAlarms()
    };
};

const startAlarm = (state, action) => {
    startAlarmFromManager();
    return state;
};

const stopAlarm = (state, action) => {
    stopAlarmFromManager();
    return state;
};

export default createReducer(initialState, {
    [types.CREATE_NEW_ALARM]: createAlarm,
    [types.DELETE_ALARM]: deleteAlarm,
    [types.START_ALARM]: startAlarm,
    [types.STOP_ALARM]: stopAlarm
});

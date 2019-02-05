import {getCurrentTime} from "./TimeService";
import { getTimeInSeconds } from "./TimeFormatter";

var alarmWatch = null;
var alarms = {};

export const startAlarm = () => {
    if (!alarmWatch){
        alarmWatch = setInterval(() => {
            let curTime = getTimeInSeconds(getCurrentTime());
            if (alarms[curTime] !== undefined){
                alarms[curTime]();

                deleteAlarm(curTime);
            }
        });
    }
};

export const stopAlarm = () => {
    if (alarmWatch){
        clearInterval(alarmWatch);
    }
};

export const addAlarm = (time, dispatcher) => {
    if (alarms[time] === undefined){
        alarms[time] = dispatcher;
    }
};

export const deleteAlarm = (time) => {
    if (alarms[time]){
        delete alarms[time];
    }
};

export const getAlarms = () => {
    return alarms;
};
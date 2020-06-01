import {getCurrentTime} from "./TimeService";
import { getTimeInSeconds } from "./TimeFormatter";

var alarmWatch = null;
var alarms = [];

export const startAlarm = () => {
    console.log("Started alarm");
    if (!alarmWatch){
        alarmWatch = setInterval(() => {
            let curTime = getTimeInSeconds(getCurrentTime());
            console.log(curTime);

            while (alarms.length > 0 && alarms[0].time <= curTime) {
                alarms[0].dispatch();
                deleteAlarm(0);
            }
        });
    }
};

export const stopAlarm = () => {
    console.log("Stopped alarm");
    if (alarmWatch){
        clearInterval(alarmWatch);
    }
};

export const addAlarm = (dispatchTime, dispatcher) => {
    console.log("Created new alarm for", dispatchTime);

    let alarm = {
        time: dispatchTime,
        dispatch: dispatcher
    };

    let alarmIndex = 0;

    if (alarms.length == 0 || alarms[alarms.length - 1] < dispatchTime) {
        alarms.push(alarm);
        alarmIndex = alarms.length - 1;

    } else if (dispatchTime < alarms[0].time) {
        alarms.unshift(alarm);
        alarmIndex = 0;

    } else {
        let i = 0;
        while (i + 1 < alarms.length) {
            if (alarms[i].time < dispatchTime && dispatchTime < alarms[i + 1].time) {
                break;
            }

            i += 1;
        }

        alarms.splice(i + 1, 0, alarm);
        alarmIndex = i;
    }

    console.log(alarms);
    
    return alarmIndex;
};

export const deleteAlarm = (index) => {
    alarms.splice(index, 1);
};

export const getAlarms = () => {
    return alarms;
};
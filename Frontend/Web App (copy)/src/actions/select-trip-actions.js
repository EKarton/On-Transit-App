import { types } from "../constants/select-trip-constants"; 

export const getTripDetails = (tripID, scheduleID) => {
    return {
        type: types.FETCH_TRIP_DETAILS,
        payload: {
            tripID: tripID,
            scheduleID: scheduleID
        }
    };
};
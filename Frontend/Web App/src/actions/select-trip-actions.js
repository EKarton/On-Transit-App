import { types } from "../constants/select-trip-constants"; 

export const getTripDetails = (transitID, tripID, scheduleID) => {
    return {
        type: types.FETCH_TRIP_DETAILS,
        payload: {
            transitID: transitID,
            tripID: tripID,
            scheduleID: scheduleID
        }
    };
};
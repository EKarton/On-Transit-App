import { types } from "../constants/notification-constants";

export const createNotification = (message, duration) => {
    return {
        type: types.DISPATCH_NOTIFICATION,
        payload: {
            message: message,
            duration: duration
        }
    };
};

export const removeNotification = () => {
    return {
        type: types.REMOVE_NOTIFICATION
    };
};

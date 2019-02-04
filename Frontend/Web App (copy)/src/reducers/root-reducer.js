import { combineReducers } from "redux";
import nearbyTripsReducer from "./nearby-trips-reducer";
import currentLocationReducer from "./geolocation-reducer";
import selectedTripReducer from "./select-trip-reducer";
import alarmsReducer from "./alarm-reducer"; 
import notificationsReducer from "./notification-reducer";

export default combineReducers({
    nearbyTrips: nearbyTripsReducer,
    selectedTrip: selectedTripReducer,
	currentLocation: currentLocationReducer,
    alarms: alarmsReducer,
    notifications: notificationsReducer
});
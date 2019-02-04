
const watchOptions = {
    enableHighAccuracy: true,
    timeout: Infinity,
    maximumAge: 0
}

var locationWatch = null;

/**
 * Starts the location watch if it is not started already.
 * The 'callbacks' object defines a set of callbacks in this format:
 * {
 *      onSuccess: <CALLBACK_1>,
 *      onError: <CALLBACK_2>
 * }
 * 
 * @param {Object} callbacks A set of callbacks
 */
export function startLocationWatch(callbacks){
    console.log("Started watching location");

    let onSuccess = callbacks.onSuccess;
    let onError = callbacks.onError;
    
    if (!locationWatch){
        locationWatch = navigator.geolocation.watchPosition(
            onSuccess, onError, watchOptions);
    }
}

export function stopLocationWatch(){
    console.log("Stopped watching locations");
    
    if (locationWatch){
        clearInterval(locationWatch);
    }
}
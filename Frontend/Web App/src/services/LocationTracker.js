const EARTH_RADIUS = 6371000; // in meters

function convertDegreesToRadians(degrees){
    return degrees * Math.PI / 180;
}

function convertRadiansToDegrees(radians){
    return (radians * 180) / Math.PI;
}

function computeBearings(lat1, long1, lat2, long2){
    let y = Math.sin(long2 - long1) * Math.cos(lat2);
    let x = (Math.cos(lat1) * Math.sin(lat2)) - 
            (Math.sin(lat1) * Math.cos(lat2) * Math.cos(long2 - long1));
    let bearingInRadans = Math.atan2(y, x);
    let bearingInDegrees = convertRadiansToDegrees(bearingInRadans);
    return (bearingInDegrees + 180) % 360;
}

function findBoundaryBetweenTwoStops(stops, time){
    let left = 0;
    let right = stops.length;

    while(left <= right){
        let mid = Math.floor((left + right) / 2);
        let nextMid = mid + 1;

        let stopA = stops[mid];
        let stopB = stops[nextMid];

        if (stopA.time <= time && time <= stopB.time){
            return [mid, nextMid];
        }
        else if (time < stopA.time){
            right = mid - 1;
        }
        else{
            left = mid + 1;
        }
    }
    throw new Error("Cannot find boundary between two stops!");
}

function calculateDestinationPoint(lat, long, bearing, distance){
    let latInRads = convertDegreesToRadians(lat);
    let longInRads = convertDegreesToRadians(long);

    let angularDistance = distance / EARTH_RADIUS;
    let bearingInRads = convertDegreesToRadians(bearing);

    let lat2InRads = Math.asin(Math.sin(latInRads) * Math.cos(angularDistance) + 
                     Math.cos(latInRads) * Math.sin(angularDistance) * Math.cos(bearingInRads));
    let lat2InDegrees = convertRadiansToDegrees(lat2InRads);

    let y = Math.sin(bearingInRads) * Math.sin(angularDistance) * Math.cos(latInRads);
    let x = Math.cos(angularDistance) - Math.sin(latInRads) * Math.sin(lat2InRads);
    let long2InRads = longInRads + Math.atan2(y, x);
    
    
    let long2InDegrees = convertRadiansToDegrees(long2InRads);
    let normalizedLong2InDegrees = (long2InDegrees + 540) % 360 - 180;
    
    return {
        lat: lat2InDegrees,
        long: normalizedLong2InDegrees
    };
}

function calculateDistance(lat1, long1, lat2, long2){
    var dLat = convertDegreesToRadians(lat2 - lat1);
    var dLong = convertDegreesToRadians(long2 - long1);
    var lat1_rads = convertDegreesToRadians(lat1);
    var lat2_rads = convertDegreesToRadians(lat2);

    var a = Math.pow(Math.sin(dLat / 2), 2) +
            Math.pow(Math.sin(dLong / 2), 2) * 
            Math.cos(lat1_rads) * Math.cos(lat2_rads); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return EARTH_RADIUS * c;
}

function computeTotalDistanceBetweenPath(path, startIndex, endIndex){
    let totalDistance = 0;
    for (let i = startIndex; i < endIndex; i++){
        let curPathLocation = path[i];
        let nextPathLocation = path[i + 1];

        let lat1 = curPathLocation.lat;
        let long1 = curPathLocation.long;
        let lat2 = nextPathLocation.lat;
        let long2 = nextPathLocation.long;
        let curDistance = calculateDistance(lat1, long1, lat2, long2);

        totalDistance += curDistance;
    }
    return totalDistance;
}

function predictLocation(path, startPathIndex, endPathIndex, ratio){
    let totalDistanceOfPath = computeTotalDistanceBetweenPath(path, startPathIndex, endPathIndex);
    let distanceToTravel = totalDistanceOfPath * ratio;

    /**
     * Get the path index "closestPathIndex" s.t. the predicted location is between 
     * path[closestPathIndex] and path[closestPathIndex + 1] inclusive.
     */
    let closestPathIndex = startPathIndex;
    while(closestPathIndex < endPathIndex){
        let curPathLocation = path[closestPathIndex];
        let nextPathLocation = path[closestPathIndex + 1];

        let lat1 = curPathLocation.lat;
        let long1 = curPathLocation.long;
        let lat2 = nextPathLocation.lat;
        let long2 = nextPathLocation.long;
        let curDistance = calculateDistance(lat1, long1, lat2, long2);

        if (distanceToTravel - curDistance < 0){
            break;
        }
        distanceToTravel -= curDistance;
        closestPathIndex ++;
    }

    // Get the predicted location between path[closestPathIndex] and path[closestPathIndex + 1]
    if (closestPathIndex === endPathIndex){
        return {
            lat: path[closestPathIndex].lat,
            long: path[closestPathIndex].long
        };
    }
    else{
        let closestPath = path[closestPathIndex];
        let nextPath = path[closestPathIndex + 1];

        let bearing = computeBearings(nextPath.lat, nextPath.long, closestPath.lat, closestPath.long);
        return calculateDestinationPoint(closestPath.lat, closestPath.long, bearing, distanceToTravel);
    }
}

function getNearestPathLocation(location, path){
    let curIndex = 0;
    let minIndex = 0;
    let maxIndex = 0;
    let minDistance = Infinity;
    while (curIndex < path.length){
        let curPathLocation = path[curIndex];
        let curDistance = calculateDistance(location.lat, location.long, curPathLocation.lat, curPathLocation.long);

        if (curDistance < minDistance){
            minDistance = curDistance;
            minIndex = curIndex;
            maxIndex = curIndex;
        }
        else if (curDistance == minDistance){
            maxIndex = curIndex;
        }

        curIndex ++;
    }
    return {
        minIndex: minIndex,
        maxIndex: maxIndex
    };
}

export function GetLocationOnPath(stops, path, time){
    let adjacentStopIndexes = findBoundaryBetweenTwoStops(stops, time);
    let leftStop = stops[adjacentStopIndexes[0]];
    let rightStop = stops[adjacentStopIndexes[1]];
    let startPathIndex = getNearestPathLocation(leftStop, path).minIndex;
    let endPathIndex = getNearestPathLocation(rightStop, path).maxIndex;

    let ratio = (time - leftStop.time) / (rightStop.time - leftStop.time);
    let predictedLocation = predictLocation(path, startPathIndex, endPathIndex, ratio);

    return predictedLocation;
}
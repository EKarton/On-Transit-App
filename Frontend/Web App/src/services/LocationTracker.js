const GIS = require("../utils/Gis");

/**
 * Returns two indexes, i and i + 1 where stops[i].time <= time && time <= stops[i + 1].time.
 * Pre-condition: stops must contain the following structure:
 *  [{
 *      lat: <latitude of stop in radians>
 *      long: <longitude of stop in radians>
 *      time: <expected time of bus / train to arrive at in seconds after midnight>
 *   }, 
 *   ...
 *  ]
 * @param {Object[]} stops A list of stops sorted by time in ascending order
 * @param {Integer} time The time in seconds after midnight
 */
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

/**
 * Computes the total distance of a path segment from path[startIndex] 
 * to path[endIndex] not including path[endIndex]
 * @param {Object[]} path A list of path locations in order
 * @param {*} startIndex The index to the start of a path segment
 * @param {*} endIndex The index to the end of a path segment
 * @returns {Float} The total distance of a path segment
 */
function computeTotalDistanceBetweenPath(path, startIndex, endIndex){
    let totalDistance = 0;
    for (let i = startIndex; i < endIndex; i++){
        let curPathLocation = path[i];
        let nextPathLocation = path[i + 1];

        let lat1 = curPathLocation.lat;
        let long1 = curPathLocation.long;
        let lat2 = nextPathLocation.lat;
        let long2 = nextPathLocation.long;
        let curDistance = GIS.calculateDistance(lat1, long1, lat2, long2);

        totalDistance += curDistance;
    }
    return totalDistance;
}

/**
 * Predicts the location in a path segment given the amount already travelled in the path segment.
 * @param {Object[]} path A set of coordinates in sorted form which outlines the path.
 * @param {Integer} startPathIndex The index to the start of a path segment in path[]
 * @param {Integer} endPathIndex The index to the end of a path segment in path[]
 * @param {Float} ratio The current amount of distance already travelled from the start 
 *      of the path to the end of the path segment.
 */
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
        let curDistance = GIS.calculateDistance(lat1, long1, lat2, long2);

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

        let bearing = GIS.computeBearings(nextPath.lat, nextPath.long, closestPath.lat, closestPath.long);
        return GIS.calculateDestinationPoint(closestPath.lat, closestPath.long, bearing, distanceToTravel);
    }
}

function getNearestPathLocation(location, path){
    let curIndex = 0;
    let minIndex = 0;
    let maxIndex = 0;
    let minDistance = Infinity;
    while (curIndex < path.length){
        let curPathLocation = path[curIndex];
        let curDistance = GIS.calculateDistance(location.lat, location.long, curPathLocation.lat, curPathLocation.long);

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
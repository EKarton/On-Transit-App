
/**
 * Formats the number of seconds to its most appropriate unit of time.
 * @param {Integer} numSeconds The number of seconds
 */
export function getFormattedTime(numSeconds) {
    let numHrsRemaining = Math.trunc(numSeconds / 3600);
    numSeconds = numSeconds % 3600;
    
    let numMinRemaining = Math.trunc(numSeconds / 60);
    numSeconds = numSeconds % 60;

    let remainingTimeValue = "";
    let remainingTimeUnit = "hours";
    if (numHrsRemaining >= 1){
        if (numHrsRemaining === 1 && numMinRemaining === 0){
            remainingTimeValue = "1";
            remainingTimeUnit = "hour";
        }
        else{
            remainingTimeValue = numHrsRemaining + ":" + Math.trunc(numMinRemaining);
            remainingTimeUnit = "hours";
        }
    }
    else if (numMinRemaining >= 1){
        if (numMinRemaining === 1 && numSeconds === 0){
            remainingTimeValue = "1";
            remainingTimeUnit = "minute";
        }
        else{
            remainingTimeValue = numMinRemaining + ":" + Math.trunc(numSeconds);
            remainingTimeUnit = "minutes";
        }
    }
    else {
        if (numSeconds === 1){
            remainingTimeValue = "1";
            remainingTimeUnit = "second";
        }
        else{
            remainingTimeValue = numSeconds.toString();
            remainingTimeUnit = "seconds";
        }
    }

    return {
        value: remainingTimeValue,
        unit: remainingTimeUnit
    };
}

/**
 * Returns the number of seconds from midnight a date object 
 * @param {Date} dateObject A date object
 */
export function getTimeInSeconds(dateObject){
    let numHrsFromMidnight = dateObject.getHours();
    let numMinFromHr = dateObject.getMinutes();
    let numSecFromMin = dateObject.getSeconds();
    return numSecFromMin + (60 * numMinFromHr) + (3600 * numHrsFromMidnight);
}

var numSeconds = 0;
var numMinutes = 4;
var numHours = 20;

var prevTime = new Date();

export function getCurrentTime(){
    let hoursString = numHours.toString().padStart(2, "0");
    let minutesString = numMinutes.toString().padStart(2, "0");
    let secondsString = numSeconds.toString().padStart(2, "0");

    let timeInString = hoursString + ":" + minutesString + ":" + secondsString;
    let dateString = "August 19, 1975 " + timeInString;

    let fakeDate = new Date(dateString);
    return fakeDate;
}

setInterval(() => {

    let newTime = new Date();
    if (newTime !== prevTime){
        let timeDiffInMs = newTime.getTime() - prevTime.getTime();
        let timeDiffInSeconds = timeDiffInMs / 1000;

        numSeconds += timeDiffInSeconds;

        if (numSeconds >= 60){
            numSeconds = 0;
            numMinutes ++;  
        }

        if (numMinutes >= 60){
            numMinutes = 0;
            numHours ++;
        }

        if (numHours >= 24){
            numHours = 0;
        }

        prevTime = newTime;
    }
});
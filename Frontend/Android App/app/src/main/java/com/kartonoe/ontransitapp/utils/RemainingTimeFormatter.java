package com.kartonoe.ontransitapp.utils;

public class RemainingTimeFormatter {

    public static RemainingTime getFormattedTime(int numSeconds) {
        int numHrsRemaining = numSeconds / 3600;
        numSeconds = numSeconds % 3600;

        int numMinRemaining = numSeconds / 60;
        numSeconds = numSeconds % 60;

        String remainingTimeValue;
        String remainingTimeUnit;
        if (numHrsRemaining >= 1){
            if (numHrsRemaining == 1 && numMinRemaining == 0){
                remainingTimeValue = "1";
                remainingTimeUnit = "hour";
            }
            else{
                remainingTimeValue = numHrsRemaining + ":" + numMinRemaining;
                remainingTimeUnit = "hours";
            }
        }
        else if (numMinRemaining >= 1){
            if (numMinRemaining == 1 && numSeconds == 0){
                remainingTimeValue = "1";
                remainingTimeUnit = "minute";
            }
            else{
                remainingTimeValue = numMinRemaining + ":" + numSeconds;
                remainingTimeUnit = "minutes";
            }
        }
        else {
            if (numSeconds == 1){
                remainingTimeValue = "1";
                remainingTimeUnit = "second";
            }
            else{
                remainingTimeValue = String.valueOf(numSeconds);
                remainingTimeUnit = "seconds";
            }
        }

        return new RemainingTime(remainingTimeValue, remainingTimeUnit);
    }
}

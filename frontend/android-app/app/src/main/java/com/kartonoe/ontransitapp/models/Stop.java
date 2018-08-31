package com.kartonoe.ontransitapp.models;

import java.sql.Time;

/**
 * A class used to represent a transit stop
 */
public class Stop {
    private Vector location;
    private Time expectedArrivalTime;
    private String stopShortName;
    private String stopLongName;

    public Stop(Vector location, Time expectedArrivalTime){
        this.location = location;
        this.expectedArrivalTime = expectedArrivalTime;
    }

    public Vector getLocation() {
        return location;
    }

    public void setLocation(Vector location) {
        this.location = location;
    }

    public Time getExpectedArrivalTime() {
        return expectedArrivalTime;
    }

    public void setExpectedArrivalTime(Time expectedArrivalTime) {
        this.expectedArrivalTime = expectedArrivalTime;
    }

    public String getStopShortName() {
        return stopShortName;
    }

    public void setStopShortName(String stopShortName) {
        this.stopShortName = stopShortName;
    }

    public String getStopLongName() {
        return stopLongName;
    }

    public void setStopLongName(String stopLongName) {
        this.stopLongName = stopLongName;
    }
}

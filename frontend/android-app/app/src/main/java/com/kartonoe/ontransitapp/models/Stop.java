package com.kartonoe.ontransitapp.models;

import java.sql.Time;

/**
 * A class used to represent a transit stop
 */
public class Stop {
    private Vector location;
    private Time expectedArrivalTime;
    private String name;

    public Stop(Vector location){
        this(location, null);
    }

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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}

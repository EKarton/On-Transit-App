package com.kartonoe.ontransitapp.models;

import java.sql.Time;

/**
 * A class used to represent a transit stop
 */
public class Stop {
    private Vector location;
    private int expectedArrivalTime;
    private String name;

    public Stop(Vector location, int expectedArrivalTime){
        this.location = location;
        this.expectedArrivalTime = expectedArrivalTime;
    }

    public Vector getLocation() {
        return location;
    }

    public void setLocation(Vector location) {
        this.location = location;
    }

    public int getExpectedArrivalTime() {
        return expectedArrivalTime;
    }

    public void setExpectedArrivalTime(int expectedArrivalTime) {
        this.expectedArrivalTime = expectedArrivalTime;
    }

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }
}

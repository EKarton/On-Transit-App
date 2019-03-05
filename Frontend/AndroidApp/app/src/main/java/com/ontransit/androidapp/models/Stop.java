package com.ontransit.androidapp.models;

/**
 * A class used to represent a transit stop
 */
public class Stop {
    private Vector location;
    private int arrivalTime;
    private String name;

    public Stop(Vector location, int arrivalTime){
        this.location = location;
        this.arrivalTime = arrivalTime;
    }

    public Vector getLocation() {
        return location;
    }

    public void setLocation(Vector location) {
        this.location = location;
    }

    public int getArrivalTime() {
        return arrivalTime;
    }

    public void setArrivalTime(int arrivalTime) {
        this.arrivalTime = arrivalTime;
    }

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }
}

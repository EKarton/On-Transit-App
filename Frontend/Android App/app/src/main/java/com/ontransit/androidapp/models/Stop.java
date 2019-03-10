package com.ontransit.androidapp.models;

import com.google.android.gms.maps.model.LatLng;

/**
 * A class used to represent a transit stop
 */
public class Stop {
    private LatLng location;
    private int arrivalTime;
    private String name;

    public Stop(LatLng location, int arrivalTime){
        this.location = location;
        this.arrivalTime = arrivalTime;
    }

    public LatLng getLocation() {
        return location;
    }

    public void setLocation(LatLng location) {
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

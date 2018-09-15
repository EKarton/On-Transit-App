package com.kartonoe.ontransitapp.models;

import com.google.android.gms.maps.model.LatLng;

public class Vehicle {
    private String tripID;
    private LatLng location;

    public Vehicle(String tripID, LatLng location){

        this.tripID = tripID;
        this.location = location;
    }

    public String getTripID() {
        return tripID;
    }

    public void setTripID(String tripID) {
        this.tripID = tripID;
    }

    public LatLng getLocation() {
        return location;
    }

    public void setLocation(LatLng location) {
        this.location = location;
    }
}

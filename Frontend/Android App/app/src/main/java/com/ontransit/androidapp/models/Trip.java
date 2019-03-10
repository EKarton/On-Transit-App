package com.ontransit.androidapp.models;

import com.google.android.gms.maps.model.LatLng;

import java.util.ArrayList;
import java.util.List;

/**
 * A class used to represent the route details
 */
public class Trip {
    private String tripID;

    private String tripShortName;
    private String tripLongName;
    private String tripDirection;
    private List<LatLng> path;
    private List<Stop> stops;
    private String scheduleID;

    public Trip(String tripID) {
        this.tripID = tripID;
        this.path = new ArrayList<>();
        this.stops = new ArrayList<>();
    }

    public String getTripID() {
        return tripID;
    }

    public String getTripShortName() {
        return tripShortName;
    }

    public void setTripShortName(String tripShortName) {
        this.tripShortName = tripShortName;
    }

    public String getTripLongName() {
        return tripLongName;
    }

    public void setTripLongName(String tripLongName) {
        this.tripLongName = tripLongName;
    }

    public List<LatLng> getPath() {
        return path;
    }

    public void setPath(List<LatLng> newPath) { this.path = newPath; }

    public List<Stop> getStops() {
        return stops;
    }

    public void setStops(List<Stop> stops) {
        this.stops = stops;
    }

    public String getTripDirection() {
        return tripDirection;
    }

    public void setTripDirection(String tripDirection) {
        this.tripDirection = tripDirection;
    }

    public void setScheduleID(String scheduleID) {
        this.scheduleID = scheduleID;
    }

    public String getScheduleID() {
        return this.scheduleID;
    }
}

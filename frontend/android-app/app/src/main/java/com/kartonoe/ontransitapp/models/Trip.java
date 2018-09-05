package com.kartonoe.ontransitapp.models;

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
    private List<Vector> path;
    private List<Stop> nextStops;

    public Trip(String tripID){
        this.tripID = tripID;
        this.path = new ArrayList<>();
        this.nextStops = new ArrayList<>();
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

    public List<Vector> getPath() {
        return path;
    }

    public void setPath(List<Vector> newPath) { this.path = newPath; }

    public List<Stop> getNextStops() {
        return nextStops;
    }

    public void setNextStops(List<Stop> nextStops) {
        this.nextStops = nextStops;
    }

    public String getTripDirection() {
        return tripDirection;
    }

    public void setTripDirection(String tripDirection) {
        this.tripDirection = tripDirection;
    }
}

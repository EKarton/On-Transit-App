package com.kartonoe.ontransitapp.models;

import java.util.ArrayList;
import java.util.List;

/**
 * A class used to represent the route details
 */
public class Route {
    private String routeID;

    private String routeShortName;
    private String routeLongName;
    private String routeDirection;
    private String pathID;
    private List<Stop> nextStops;

    public Route(String routeID, String pathID){
        this.routeID = routeID;
        this.pathID = pathID;
        this.nextStops = new ArrayList<>();
    }

    public String getPathID() {
        return pathID;
    }

    public String getRouteID() {
        return routeID;
    }

    public String getRouteShortName() {
        return routeShortName;
    }

    public void setRouteShortName(String routeShortName) {
        this.routeShortName = routeShortName;
    }

    public String getRouteLongName() {
        return routeLongName;
    }

    public void setRouteLongName(String routeLongName) {
        this.routeLongName = routeLongName;
    }

    public List<Stop> getNextStops() {
        return nextStops;
    }

    public void setNextStops(List<Stop> nextStops) {
        this.nextStops = nextStops;
    }

    public String getRouteDirection() {
        return routeDirection;
    }

    public void setRouteDirection(String routeDirection) {
        this.routeDirection = routeDirection;
    }
}

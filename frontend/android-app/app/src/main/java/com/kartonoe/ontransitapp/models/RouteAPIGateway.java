package com.kartonoe.ontransitapp.models;

import java.util.ArrayList;
import java.util.List;

/**
 * A singleton that is used to make calls to the server
 */
public class RouteAPIGateway {

    private static RouteAPIGateway instance = null;

    public static RouteAPIGateway getInstance(){
        if (instance == null){
            instance = new RouteAPIGateway();
        }
        return instance;
    }

    private RouteAPIGateway(){}

    public List<Route> getRoutesNearLocation(Vector location, double radius){
        Route detail1 = new Route("123456789", "123456789");
        detail1.setRouteShortName("109");
        detail1.setRouteLongName("Meadowvale Express");

        Route detail2 = new Route("987654321", "987654321");
        detail1.setRouteShortName("110");
        detail1.setRouteLongName("University Express");

        List<Route> details = new ArrayList<>();
        details.add(detail1);
        details.add(detail2);
        return details;
    }

    public List<Vector> getPath(Route route){
        switch(route.getPathID()){
            case "123456789":
                return new ArrayList<Vector>();
            case "987654321":
                return new ArrayList<Vector>();
            default:
                return new ArrayList<Vector>();
        }
    }
}

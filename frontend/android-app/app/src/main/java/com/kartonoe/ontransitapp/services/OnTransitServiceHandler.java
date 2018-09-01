package com.kartonoe.ontransitapp.services;

import com.kartonoe.ontransitapp.models.Route;
import com.kartonoe.ontransitapp.models.Vehicle;

import java.util.List;

public interface OnTransitServiceHandler {
    void handleRoutesFromLocation(List<String> routeIDs);
    void handleRouteDetails(Route route);
    void handleVehiclesFromLocation(List<Vehicle> vehicles);
}

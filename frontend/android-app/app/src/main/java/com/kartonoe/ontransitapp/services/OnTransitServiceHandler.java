package com.kartonoe.ontransitapp.services;

import com.kartonoe.ontransitapp.models.Trip;
import com.kartonoe.ontransitapp.models.Vehicle;

import java.util.List;

public interface OnTransitServiceHandler {
    void handleRoutesFromLocation(List<String> routeIDs);
    void handleRouteDetails(Trip trip);
    void handleVehiclesFromLocation(List<Vehicle> vehicles);
}

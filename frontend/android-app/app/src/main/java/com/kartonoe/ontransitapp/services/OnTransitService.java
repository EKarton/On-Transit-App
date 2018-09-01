package com.kartonoe.ontransitapp.services;

import android.content.Context;

import com.google.android.gms.maps.model.LatLng;

import java.net.URISyntaxException;

public interface OnTransitService {
    void getRoutesNearLocation(LatLng location, GetRoutesHandler handler);
    void getRouteDetails(String routeID, GetRouteDetailsHandler handler);
    void getVehiclesNearLocation(LatLng location, double radius, GetVehiclesHandler handler);
    void getVehicleDetails(String vehicleID, GetVehicleDetailsHandler handler);
}

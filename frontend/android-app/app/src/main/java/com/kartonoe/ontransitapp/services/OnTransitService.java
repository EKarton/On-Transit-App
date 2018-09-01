package com.kartonoe.ontransitapp.services;

import android.content.Context;

import com.google.android.gms.maps.model.LatLng;

import java.net.URISyntaxException;

public interface OnTransitService {

    // For debugging purposes (to put in the Log.d())
    String LOG_TAG = "OnTransitService";

    void getRoutesNearLocation(LatLng location, double radius, GetRoutesHandler handler);
    void getRouteDetails(String routeID, GetRouteDetailsHandler handler);
    void getVehiclesNearLocation(LatLng location, double radius, GetVehiclesHandler handler);
}

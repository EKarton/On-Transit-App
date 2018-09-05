package com.kartonoe.ontransitapp.services;

import com.google.android.gms.maps.model.LatLng;

public interface OnTransitService {

    // For debugging purposes (to put in the Log.d())
    String LOG_TAG = "OnTransitService";

    void getTripIDsNearLocation(LatLng location, double radius, GetTripsHandler handler);
    void getTripDetails(String routeID, GetTripDetailsHandler handler);
    void getVehiclesNearLocation(LatLng location, double radius, GetVehiclesHandler handler);
}

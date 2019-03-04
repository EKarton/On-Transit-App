package com.kartonoe.ontransitapp.services;

import com.google.android.gms.maps.model.LatLng;

public interface OnTransitService {

    // For debugging purposes (to put in the Log.d())
    String LOG_TAG = "OnTransitService";

    void getTripIDsNearLocation(LatLng location, double radius, String time, GetNearbyTripsHandler handler);
    void getTripDetails(String tripID, String scheduleID, GetTripDetailsHandler handler);
}

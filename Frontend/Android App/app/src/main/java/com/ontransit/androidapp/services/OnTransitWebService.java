package com.ontransit.androidapp.services;

import android.content.Context;
import android.util.Log;

import com.android.volley.DefaultRetryPolicy;
import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;
import com.google.android.gms.maps.model.LatLng;

import java.net.URI;
import java.net.URISyntaxException;

/**
 * A singleton that is used to make calls to the On Transit service
 */
public class OnTransitWebService implements OnTransitService {

    // Basic server details
    private final String SERVER_PROTOCOL = "https";
    private final String SERVER_AUTH = null;
    private final String SERVER_HOSTNAME = "on-transit-app-api-gateway.herokuapp.com";
    private final int SERVER_PORT = -1;

    // Trips
    private final static String TRIPS_LOCATOR_ROUTE = "/api/v1/trips";
    private final static String TRIP_DETAILS_ROUTE = "/api/v1/trips/%s/schedules/%s";
    private final RequestQueue requestQueue;

    public OnTransitWebService(Context context) {
        this.requestQueue = Volley.newRequestQueue(context);
    }

    public void getTripIDsNearLocation(LatLng location, double radius, String time, GetNearbyTripsHandler handler) {
        String query = new StringBuilder("lat=")
                .append(location.latitude)
                .append("&long=")
                .append(location.longitude)
                .append("&radius=")
                .append(radius)
                .append("&time=")
                .append(time)
                .toString();

        try {
            URI uri = new URI(SERVER_PROTOCOL, SERVER_AUTH, SERVER_HOSTNAME, SERVER_PORT,
                    TRIPS_LOCATOR_ROUTE, query, null);

            Log.d(LOG_TAG, "Making HTTP request to " + uri);


            JsonObjectRequest request = new JsonObjectRequest(Request.Method.GET,
                    uri.toString(), null, handler, handler);

            request.setRetryPolicy(new DefaultRetryPolicy(
                    500000,
                    DefaultRetryPolicy.DEFAULT_MAX_RETRIES,
                    DefaultRetryPolicy.DEFAULT_BACKOFF_MULT));

            this.requestQueue.add(request);
        } catch (URISyntaxException e) {
            Log.d(LOG_TAG, e.getMessage());
            handler.onError(e);
        }
    }

    public void getTripDetails(String tripID, String scheduleID, GetTripDetailsHandler handler) {
        String apiEndpoint = String.format(TRIP_DETAILS_ROUTE, tripID, scheduleID);

        try {
            URI uri = new URI(SERVER_PROTOCOL, SERVER_AUTH, SERVER_HOSTNAME, SERVER_PORT,
                    apiEndpoint, null, null);

            Log.d(LOG_TAG, "Making HTTP request to " + uri);

            JsonObjectRequest request = new JsonObjectRequest(Request.Method.GET,
                    uri.toString(), null, handler, handler);

            request.setRetryPolicy(new DefaultRetryPolicy(
                    500000,
                    DefaultRetryPolicy.DEFAULT_MAX_RETRIES,
                    DefaultRetryPolicy.DEFAULT_BACKOFF_MULT));

            this.requestQueue.add(request);
        } catch (URISyntaxException e) {
            Log.d(LOG_TAG, e.getMessage());
            handler.onError(e);
        }
    }
}

package com.kartonoe.ontransitapp.services;

import android.content.Context;
import android.util.Log;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;
import com.google.android.gms.maps.model.LatLng;

import java.net.URI;
import java.net.URISyntaxException;

/**
 * A singleton that is used to make calls to the server
 */
public class OnTransitWebService implements OnTransitService {

    // Basic server details
    private final String SERVER_PROTOCOL = "http";
    private final String SERVER_AUTH = null;
    private final String SERVER_HOSTNAME = "192.168.100.169";
    private final int SERVER_PORT = 3000;

    // Routes
    private final String ROUTES_URI = "/api/v1/routes";
    private final String VEHICLES_URI = "/api/v1/vehicles";

    private static OnTransitService instance = null;

    private final RequestQueue requestQueue;

    public static OnTransitService getInstance(Context context) {
        if (instance == null) {
            instance = new OnTransitWebService(context);
        }
        return instance;
    }

    private OnTransitWebService(Context context) {
        this.requestQueue = Volley.newRequestQueue(context);
    }

    public void getTripIDsNearLocation(LatLng location, double radius, GetTripsHandler handler) {
        String query = new StringBuilder("lat=")
                .append(location.latitude)
                .append("&long=")
                .append(location.longitude)
                .append("&radius=")
                .append(radius)
                .toString();


        try {
            URI uri = new URI(SERVER_PROTOCOL, SERVER_AUTH, SERVER_HOSTNAME, SERVER_PORT,
                    ROUTES_URI, query, null);

            Log.d(LOG_TAG, "Making HTTP request to " + uri);


            JsonObjectRequest request = new JsonObjectRequest(Request.Method.GET,
                    uri.toString(), null, handler, handler);

            this.requestQueue.add(request);
        } catch (URISyntaxException e) {
            Log.d(LOG_TAG, e.getMessage());
            handler.onError(404, e.getMessage());
        }
    }

    public void getTripDetails(String routeID, GetTripDetailsHandler handler) {
        String apiEndpoint = new StringBuilder(ROUTES_URI)
                .append("/")
                .append(routeID)
                .toString();

        try {
            URI uri = new URI(SERVER_PROTOCOL, SERVER_AUTH, SERVER_HOSTNAME, SERVER_PORT,
                    apiEndpoint, null, null);

            Log.d(LOG_TAG, "Making HTTP request to " + uri);

            JsonObjectRequest request = new JsonObjectRequest(Request.Method.GET,
                    uri.toString(), null, handler, handler);

            this.requestQueue.add(request);
        } catch (URISyntaxException e) {
            Log.d(LOG_TAG, e.getMessage());
            handler.onError(404, e.getMessage());
        }
    }

    public void getVehiclesNearLocation(LatLng location, double radius, GetVehiclesHandler handler) {
        // Create the URL
        String query = new StringBuilder("lat=")
                .append(location.latitude)
                .append("&long=")
                .append(location.longitude)
                .append("&radius=")
                .append(radius)
                .toString();

        try {
            URI uri = new URI(SERVER_PROTOCOL, SERVER_AUTH, SERVER_HOSTNAME, SERVER_PORT, VEHICLES_URI,
                    query, null);

            Log.d(LOG_TAG, "Making HTTP request to " + uri);

            // Send the request
            JsonObjectRequest request = new JsonObjectRequest(Request.Method.GET,
                    uri.toString(), null, handler, handler);

            this.requestQueue.add(request);
        } catch (URISyntaxException e) {
            Log.d(LOG_TAG, e.getMessage());
            handler.onError(404, e.getMessage());
        }
    }
}

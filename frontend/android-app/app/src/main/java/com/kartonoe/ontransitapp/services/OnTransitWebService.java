package com.kartonoe.ontransitapp.services;

import android.content.Context;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.toolbox.StringRequest;
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
    private final String SERVER_HOSTNAME = "localhost";
    private final int SERVER_PORT = 3000;

    // Routes
    private final String ROUTES_URI = "api/v1/routes";
    private final String VEHICLES_URI = "api/v1/vehicles";

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

    public void getRoutesNearLocation(LatLng location, GetRoutesHandler handler) {
        String query = new StringBuilder("lat=")
                .append(location.latitude)
                .append("&long=")
                .append(location.longitude).toString();
        URI uri = null;
        try {
            uri = new URI(SERVER_PROTOCOL, SERVER_AUTH, SERVER_HOSTNAME, SERVER_PORT,
                    ROUTES_URI, query, null);
        } catch (URISyntaxException e) {
            handler.onError(404, "Invalid query, " + uri);
        }

        StringRequest request = new StringRequest(Request.Method.GET, uri.toString(),
                handler, handler);

        this.requestQueue.add(request);
    }

    public void getRouteDetails(String routeID, GetRouteDetailsHandler handler) {
        String apiEndpoint = new StringBuilder(ROUTES_URI)
                .append("/")
                .append(routeID)
                .toString();

        URI uri = null;
        try {
            uri = new URI(SERVER_PROTOCOL, SERVER_AUTH, SERVER_HOSTNAME, SERVER_PORT,
                    apiEndpoint, null, null);
        } catch (URISyntaxException e) {
            handler.onError(404, "Invalid query, " + uri);
        }

        StringRequest request = new StringRequest(Request.Method.GET, uri.toString(),
                handler, handler);

        this.requestQueue.add(request);
    }

    public void getVehiclesNearLocation(LatLng location, double radius, GetVehiclesHandler handler) {
        // Create the URL
        String query = new StringBuilder("lat=")
                .append(location.latitude)
                .append("&long=")
                .append(location.longitude).toString();
        URI uri = null;
        try {
            uri = new URI(SERVER_PROTOCOL, SERVER_AUTH, SERVER_HOSTNAME, SERVER_PORT, VEHICLES_URI,
                    query, null);
        } catch (URISyntaxException e) {
            handler.onError(404, "Invalid query, " + uri);
        }

        // Send the request
        StringRequest request = new StringRequest(Request.Method.GET, uri.toString(), handler, handler);

        this.requestQueue.add(request);
    }

    public void getVehicleDetails(String vehicleID, GetVehicleDetailsHandler handler) {
        String apiEndpoint = new StringBuilder(VEHICLES_URI)
                .append("/")
                .append(vehicleID)
                .toString();

        URI uri = null;
        try {
            uri = new URI(SERVER_PROTOCOL, SERVER_AUTH, SERVER_HOSTNAME, SERVER_PORT, apiEndpoint,
                    null, null);
        } catch (URISyntaxException e) {
            handler.onError(404, "Invalid query, " + uri);
        }

        // Send the request
        StringRequest request = new StringRequest(Request.Method.GET, uri.toString(), handler, handler);

        this.requestQueue.add(request);
    }
}
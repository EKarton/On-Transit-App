package com.kartonoe.ontransitapp.services;

import android.util.Log;

import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.kartonoe.ontransitapp.models.Route;
import com.kartonoe.ontransitapp.models.Stop;
import com.kartonoe.ontransitapp.models.Vector;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import static com.kartonoe.ontransitapp.services.OnTransitService.LOG_TAG;

public abstract class GetRouteDetailsHandler implements Response.Listener<JSONObject>, Response.ErrorListener {

    @Override
    public void onErrorResponse(VolleyError error) {
        Log.d(LOG_TAG, "Received ERROR Response: " + error.getMessage());
    }

    @Override
    public void onResponse(JSONObject response) {
        Log.d(LOG_TAG, "Received HTTP Response: " + response);
        try {
            if (!response.getString("status").equals("success")){
                onError(500, "status is not success!");
            }
            else{
                // Parse the data
                JSONObject rawData = response.getJSONObject("data");
                String routeID = rawData.getString("id");
                String shortName = rawData.getString("shortName");
                String longName = rawData.getString("longName");

                // Parse the stops
                List<Stop> stops = new ArrayList<>();
                JSONArray rawStopsData = rawData.getJSONArray("stops");
                for (int i = 0; i < rawStopsData.length(); i++){
                    JSONObject rawStopData = rawStopsData.getJSONObject(i);

                    // Parse the location
                    String rawLatitude = rawStopData.getString("lat");
                    String rawLongitude = rawStopData.getString("long");
                    double latitude = Double.parseDouble(rawLatitude);
                    double longitude = Double.parseDouble(rawLongitude);
                    Vector location = new Vector(latitude, longitude);

                    String rawTime = rawStopData.getString("time");

                    Stop stop = new Stop(location, null);
                    stops.add(stop);
                }

                // Parse the shapes
                List<Vector> path = new ArrayList<>();
                JSONArray rawPathData = rawData.getJSONArray("path");
                for (int i = 0; i < rawPathData.length(); i++){
                    JSONObject rawPointData = rawPathData.getJSONObject(i);

                    // Parse the location
                    String rawLatitude = rawPointData.getString("lat");
                    String rawLongitude = rawPointData.getString("long");
                    double latitude = Double.parseDouble(rawLatitude);
                    double longitude = Double.parseDouble(rawLongitude);
                    Vector point = new Vector(latitude, longitude);

                    path.add(point);
                }

                // Create the route object
                Route route = new Route(routeID);
                route.setRouteShortName(shortName);
                route.setRouteLongName(longName);
                route.setPath(path);
                route.setNextStops(stops);

                this.onSuccess(route);
            }

        } catch (JSONException e) {
            onError(500, e.getMessage());
        }
    }

    public abstract void onSuccess(Route route);
    public abstract void onError(int errorCode, String errorMessage);
}

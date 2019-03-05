package com.kartonoe.ontransitapp.services;

import android.util.Log;

import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.kartonoe.ontransitapp.models.Trip;
import com.kartonoe.ontransitapp.models.Stop;
import com.kartonoe.ontransitapp.models.Vector;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import static com.kartonoe.ontransitapp.services.OnTransitService.LOG_TAG;

public abstract class GetTripDetailsHandler implements Response.Listener<JSONObject>, Response.ErrorListener {

    @Override
    public void onErrorResponse(VolleyError error) {
        Log.d(LOG_TAG, "Received ERROR Response: " + error.getMessage());
        this.onError(error);
    }

    @Override
    public void onResponse(JSONObject response) {
        Log.d(LOG_TAG, "Received HTTP Response: " + response);
        try {
            if (!response.getString("status").equals("success")){
                onError(new Exception("status is not success!"));
            }
            else{
                // Parse the data
                JSONObject rawData = response.getJSONObject("data");
                String routeID = rawData.getString("id");
                String shortName = rawData.getString("shortName");
                String longName = rawData.getString("longName");

                // Parse the stops
                JSONArray rawStopsData = rawData.getJSONArray("stops");
                List<Stop> stops = parseStops(rawStopsData);

                // Parse the shapes
                JSONArray rawPathData = rawData.getJSONArray("path");
                List<Vector> path = parsePath(rawPathData);

                // Create the trip object
                Trip trip = new Trip(routeID);
                trip.setTripShortName(shortName);
                trip.setTripLongName(longName);
                trip.setPath(path);
                trip.setNextStops(stops);

                this.onSuccess(trip);
            }

        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }

    private List<Stop> parseStops(JSONArray rawStopsArray) throws JSONException {
        List<Stop> stops = new ArrayList<>();
        for (int i = 0; i < rawStopsArray.length(); i++){
            JSONObject rawStopData = rawStopsArray.getJSONObject(i);

            // Parse the location
            String rawLatitude = rawStopData.getString("lat");
            String rawLongitude = rawStopData.getString("long");
            String rawStopName = rawStopData.getString("name");

            double latitude = Double.parseDouble(rawLatitude);
            double longitude = Double.parseDouble(rawLongitude);
            Vector location = new Vector(latitude, longitude);

            int arrivalTime = rawStopData.getInt("time");

            Stop stop = new Stop(location, arrivalTime);
            stop.setName(rawStopName);
            stops.add(stop);
        }
        return stops;
    }

    private List<Vector> parsePath(JSONArray rawPathData) throws JSONException {
        List<Vector> path = new ArrayList<>();
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
        return path;
    }

    public abstract void onSuccess(Trip trip);
    public abstract void onError(Exception exception);
}

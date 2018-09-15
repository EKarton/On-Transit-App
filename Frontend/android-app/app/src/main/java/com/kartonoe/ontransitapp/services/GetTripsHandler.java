package com.kartonoe.ontransitapp.services;

import android.util.Log;

import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.google.android.gms.maps.model.LatLng;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.TreeSet;

import static com.kartonoe.ontransitapp.services.OnTransitService.LOG_TAG;

public abstract class GetTripsHandler implements Response.Listener<JSONObject>, Response.ErrorListener{

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
                onError(new Exception("Status returned is not successful!"));
            }
            else{
                JSONObject rawData = response.getJSONObject("data");
                JSONArray rawTripIDs = rawData.getJSONArray("tripIDs");

                TreeSet<String> tripIDs = new TreeSet<>();
                for (int i = 0; i < rawTripIDs.length(); i++) {
                    String routeID = rawTripIDs.getString(i);
                    tripIDs.add(routeID);
                }

                onSuccess(tripIDs);
            }

        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }

    public abstract void onSuccess(TreeSet<String> tripIDs);
    public abstract void onError(Exception exception);
}

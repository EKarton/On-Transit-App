package com.kartonoe.ontransitapp.services;

import android.util.Log;

import com.android.volley.Response;
import com.android.volley.VolleyError;

import org.json.JSONObject;

import static com.kartonoe.ontransitapp.services.OnTransitService.LOG_TAG;

public abstract class GetVehiclesHandler implements Response.Listener<JSONObject>, Response.ErrorListener {
    @Override
    public void onErrorResponse(VolleyError error) {
        Log.d(LOG_TAG, "Received ERROR Response: " + error.getMessage());
    }

    @Override
    public void onResponse(JSONObject response) {
        Log.d(LOG_TAG, "Received HTTP Response: " + response);
    }

    public abstract void onSuccess(String vehicleID, String routeID);
    public abstract void onError(int errorCode, String message);
}

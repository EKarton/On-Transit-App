package com.kartonoe.ontransitapp.services;

import android.util.Log;

import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.kartonoe.ontransitapp.models.Route;

import org.json.JSONObject;

import static com.kartonoe.ontransitapp.services.OnTransitService.LOG_TAG;

public abstract class GetRouteDetailsHandler implements Response.Listener<String>, Response.ErrorListener {

    @Override
    public void onErrorResponse(VolleyError error) {
        Log.d(LOG_TAG, "Received ERROR Response: " + error.getMessage());
    }

    @Override
    public void onResponse(String response) {
        Log.d(LOG_TAG, "Received HTTP Response: " + response);
    }

    public abstract void onSuccess(Route route);
    public abstract void onError(int errorCode, String errorMessage);
}

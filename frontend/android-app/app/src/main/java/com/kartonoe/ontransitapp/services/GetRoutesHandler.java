package com.kartonoe.ontransitapp.services;

import android.util.Log;

import com.android.volley.Response;
import com.android.volley.VolleyError;

import java.util.List;

import static com.kartonoe.ontransitapp.services.OnTransitService.LOG_TAG;

public abstract class GetRoutesHandler implements Response.Listener<String>, Response.ErrorListener{

    @Override
    public void onErrorResponse(VolleyError error) {
        Log.d(LOG_TAG, "Received ERROR Response: " + error.getMessage());
    }

    @Override
    public void onResponse(String response) {
        Log.d(LOG_TAG, "Received HTTP Response: " + response);
    }

    public abstract void onSuccess(List<String> routeIDs);
    public abstract void onError(int errorCode, String errorMessage);
}

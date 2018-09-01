package com.kartonoe.ontransitapp.services;

import android.util.Log;

import com.android.volley.Response;
import com.android.volley.VolleyError;

import java.util.List;

public abstract class GetRoutesHandler implements Response.Listener<String>, Response.ErrorListener{

    @Override
    public void onErrorResponse(VolleyError error) {

    }

    @Override
    public void onResponse(String response) {
        Log.d("MainActivity", "I AM HERERERERERE");
        Log.d("MainActivity", response);
    }

    public abstract void onSuccess(List<String> routeIDs);
    public abstract void onError(int errorCode, String errorMessage);
}

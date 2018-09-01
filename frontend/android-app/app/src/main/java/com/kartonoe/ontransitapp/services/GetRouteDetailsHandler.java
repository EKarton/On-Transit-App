package com.kartonoe.ontransitapp.services;

import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.kartonoe.ontransitapp.models.Route;

import org.json.JSONObject;

public abstract class GetRouteDetailsHandler implements Response.Listener<String>, Response.ErrorListener {
    @Override
    public void onErrorResponse(VolleyError error) {

    }

    @Override
    public void onResponse(String response) {
        System.out.println(response);
    }

    public abstract void onSuccess(Route route);
    public abstract void onError(int errorCode, String errorMessage);
}

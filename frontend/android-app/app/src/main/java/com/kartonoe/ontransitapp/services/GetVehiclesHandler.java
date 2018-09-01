package com.kartonoe.ontransitapp.services;

import com.android.volley.Response;
import com.android.volley.VolleyError;

public abstract class GetVehiclesHandler implements Response.Listener<String>, Response.ErrorListener {
    @Override
    public void onErrorResponse(VolleyError error) {

    }

    @Override
    public void onResponse(String response) {

    }

    abstract void onSuccess(String vehicleID, String routeID);
    abstract void onError(int errorCode, String message);
}

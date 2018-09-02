package com.kartonoe.ontransitapp.services;

import android.util.Log;

import com.android.volley.Response;
import com.android.volley.VolleyError;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import static com.kartonoe.ontransitapp.services.OnTransitService.LOG_TAG;

public abstract class GetRoutesHandler implements Response.Listener<JSONObject>, Response.ErrorListener{

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
                JSONObject rawData = response.getJSONObject("data");
                JSONArray rawRouteIDs = rawData.getJSONArray("routeIDs");

                List<String> routeIDs = new ArrayList<>();
                for (int i = 0; i < rawRouteIDs.length(); i++) {
                    String routeID = rawRouteIDs.getString(i);
                    routeIDs.add(routeID);
                }

                onSuccess(routeIDs);
            }

        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }

    public abstract void onSuccess(List<String> routeIDs);
    public abstract void onError(int errorCode, String errorMessage);
}

package com.kartonoe.ontransitapp.services;

import android.util.Log;

import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.google.android.gms.maps.model.LatLng;
import com.kartonoe.ontransitapp.models.NearbyTrip;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.TreeSet;

import static com.kartonoe.ontransitapp.services.OnTransitService.LOG_TAG;

public abstract class GetNearbyTripsHandler implements Response.Listener<JSONObject>, Response.ErrorListener{

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
                JSONObject rawTripIDs = rawData.getJSONObject("tripIDs");

                Iterator<String> keys = rawTripIDs.keys();

                List<NearbyTrip> nearbyTrips = new ArrayList<>();

                while(keys.hasNext()) {
                    String key = keys.next();
                    if (rawTripIDs.get(key) instanceof JSONObject) {

                        JSONObject nearbyTripDetails = rawTripIDs.getJSONObject(key);

                        String tripID = key;
                        String shortName = nearbyTripDetails.getString("shortname");
                        String longName = nearbyTripDetails.getString("longname");
                        String headSign = nearbyTripDetails.getString("headsign");
                        String type = nearbyTripDetails.getString("type");
                        JSONArray schedules = nearbyTripDetails.getJSONArray("schedules");

                        for (int i = 0; i < schedules.length(); i++) {
                            String scheduleID = schedules.getString(i);

                            NearbyTrip nearbyTrip = new NearbyTrip(tripID, shortName, longName, headSign, type, scheduleID);
                            nearbyTrips.add(nearbyTrip);
                        }
                    }
                }

                onSuccess(nearbyTrips);
            }

        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }

    public abstract void onSuccess(List<NearbyTrip> nearbyTrips);
    public abstract void onError(Exception exception);
}

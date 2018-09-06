package com.kartonoe.ontransitapp.services;

import android.util.Log;

import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.google.android.gms.maps.model.LatLng;
import com.kartonoe.ontransitapp.models.Vehicle;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import static com.kartonoe.ontransitapp.services.OnTransitService.LOG_TAG;

public abstract class GetVehiclesHandler implements Response.Listener<JSONObject>, Response.ErrorListener {

    @Override
    public void onErrorResponse(VolleyError error) {
        Log.d(LOG_TAG, "Received ERROR Response: " + error.getMessage());
        this.onError(error);
    }

    @Override
    public void onResponse(JSONObject response) {
        Log.d(LOG_TAG, "Received HTTP Response: " + response);

        try{
            if (!response.getString("status").equals("success")) {
                this.onError(new Exception("Status is not success!"));
            }
            else{
                // Parse the vehicles
                JSONObject rawData = response.getJSONObject("data");
                JSONArray rawTripIDs = rawData.getJSONArray("tripIDs");

                // Parse the vehicles
                List<Vehicle> vehicles = new ArrayList<>();
                for (int i = 0; i < rawTripIDs.length(); i++){

                    // Parse the trip ID
                    JSONObject rawVehicleData = rawTripIDs.getJSONObject(i);
                    String tripID = rawVehicleData.getString("tripID");

                    // Parse the vehicle location
                    JSONObject rawPositionData = rawVehicleData.getJSONObject("position");
                    double latitude = rawPositionData.getDouble("_x");
                    double longitude = rawPositionData.getDouble("_y");
                    LatLng vehiclePosition = new LatLng(latitude, longitude);

                    // Add the vehicle to the list
                    Vehicle vehicle = new Vehicle(tripID, vehiclePosition);
                    vehicles.add(vehicle);
                }

                this.onSuccess(vehicles);
            }
        }
        catch(JSONException exception){
            this.onError(exception);
        }
    }

    public abstract void onSuccess(List<Vehicle> vehicles);
    public abstract void onError(Exception exception);
}

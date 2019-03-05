package com.ontransit.androidapp.services;

import android.content.Context;
import android.content.res.Resources;
import android.util.Log;

import com.google.android.gms.maps.model.LatLng;
import com.ontransit.androidapp.R;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Calendar;

public class OnTransitMockedWebService implements OnTransitService {

    private static OnTransitService instance = null;
    private final Context context;

    public static OnTransitService getInstance(Context context) {
        if (instance == null) {
            instance = new OnTransitMockedWebService(context);
        }
        return instance;
    }

    public OnTransitMockedWebService(Context context) {
        this.context = context;
    }

    private String getJsonAsString(int id) {
        Resources resources = this.context.getResources();

        InputStream resourceReader = resources.openRawResource(id);
        StringBuilder stringBuilder = new StringBuilder();
        try {
            BufferedReader reader = new BufferedReader(new InputStreamReader(resourceReader, "UTF-8"));
            String line = reader.readLine();
            while (line != null) {
                stringBuilder.append(line);
                line = reader.readLine();
            }
        } catch (Exception e) {
            Log.e(OnTransitService.LOG_TAG, "Unhandled exception while getting JSON response", e);
        } finally {
            try {
                resourceReader.close();
            } catch (Exception e) {
                Log.e(OnTransitService.LOG_TAG, "Unhandled exception while getting JSON response", e);
            }
        }

        return stringBuilder.toString();
    }

    @Override
    public void getTripIDsNearLocation(LatLng location, double radius, String time, GetNearbyTripsHandler handler) {
        String mockedJsonResponse = getJsonAsString(R.raw.mocked_nearby_trips_response);

        try {
            JSONObject jsonObject = new JSONObject(mockedJsonResponse);
            handler.onResponse(jsonObject);
        } catch (JSONException e) {
            handler.onResponse(null);
        }
    }

    @Override
    public void getTripDetails(String tripID, String scheduleID, GetTripDetailsHandler handler) {
        String mockedJsonResponse = getJsonAsString(R.raw.mocked_trip_details_response);

        try {
            JSONObject jsonObject = new JSONObject(mockedJsonResponse);

            // Modify the times on them.
            JSONArray stops = jsonObject.getJSONObject("data").getJSONArray("stops");
            for (int i = 0; i < stops.length(); i++) {
                JSONObject stop = stops.getJSONObject(i);

                Calendar curTime = Calendar.getInstance();
                curTime.add(Calendar.SECOND, i + 20);

                int numHoursFromMidnight = curTime.get(Calendar.HOUR_OF_DAY);
                int numMinutesFromHour = curTime.get(Calendar.MINUTE);
                int numSecondsFromMin = curTime.get(Calendar.SECOND);
                int numSecondsFromMidnight = numSecondsFromMin + (60 * numMinutesFromHour) + (3600 * numHoursFromMidnight);

                stop.put("time", numSecondsFromMidnight);
            }

            handler.onResponse(jsonObject);
        } catch (JSONException e) {
            handler.onResponse(null);
        }
    }
}

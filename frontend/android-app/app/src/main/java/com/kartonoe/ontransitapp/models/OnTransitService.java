package com.kartonoe.ontransitapp.models;

import com.google.android.gms.common.api.Response;

import java.util.ArrayList;
import java.util.List;

/**
 * A singleton that is used to make calls to the server
 */
public class OnTransitService {

    private static OnTransitService instance = null;

    public static OnTransitService getInstance(){
        if (instance == null){
            instance = new OnTransitService();
        }
        return instance;
    }

    private OnTransitService(){
        // Instantiate the RequestQueue.
        RequestQueue queue = Volley.newRequestQueue(this);
        String url ="http://www.google.com";

// Request a string response from the provided URL.
        StringRequest stringRequest = new StringRequest(DownloadManager.Request.Method.GET, url,
                new Response.Listener<String>() {
                    @Override
                    public void onResponse(String response) {
                        // Display the first 500 characters of the response string.
                        mTextView.setText("Response is: "+ response.substring(0,500));
                    }
                }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                mTextView.setText("That didn't work!");
            }
        });

// Add the request to the RequestQueue.
        queue.add(stringRequest);
    }

    public List<Route> getRoutesNearLocation(Vector location, double radius){
        return null;
    }

    public List<Vector> getPath(Route route){
        return null;
    }
}

package com.ontransit.androidapp.services;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Criteria;
import android.location.Location;
import android.location.LocationListener;
import android.os.Bundle;
import android.support.v4.app.ActivityCompat;

import com.google.android.gms.maps.model.LatLng;

public class LocationServices {

    private final android.location.LocationManager locationManager;
    private final LocationListener locationListener;
    private final Activity activity;

    public LocationServices(Activity activity) {
        this.activity = activity;
        this.locationManager = (android.location.LocationManager)
                activity.getSystemService(Context.LOCATION_SERVICE);

        this.locationListener = new LocationListener() {
            @Override
            public void onLocationChanged(Location location) {

            }
            @Override
            public void onStatusChanged(String provider, int status, Bundle extras) {

            }

            @Override
            public void onProviderEnabled(String provider) {

            }

            @Override
            public void onProviderDisabled(String provider) {

            }
        };

        requestLocation();
    }

    @SuppressLint("MissingPermission")
    private void requestLocation(){
        if (handlePermissions()){
            locationManager.requestLocationUpdates(android.location.LocationManager.GPS_PROVIDER, 5000, 5, locationListener);
        }
    }

    private boolean handlePermissions(){
        return handlePermissions(Manifest.permission.ACCESS_FINE_LOCATION) &&
                handlePermissions(Manifest.permission.ACCESS_COARSE_LOCATION) &&
                handlePermissions(Manifest.permission.INTERNET);
    }

    private boolean handlePermissions(String permission) {

        // Check to see if the permission is already granted
        if (ActivityCompat.checkSelfPermission(activity, permission) != PackageManager.PERMISSION_GRANTED) {

            // Check to see if the user has declined the permission already
            if (ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)) {

                // We need to explain to the user why we need this permission
                return false;
            }
            else {

                // Ask the user to accept the permission
                ActivityCompat.requestPermissions(activity, new String[] { permission }, 1);
                return handlePermissions();
            }
        }
        else {
            return true;
        }
    }

    public LatLng getLastKnownLocation() {
        LatLng result = null;

        String provider = locationManager.getBestProvider(new Criteria(), false);
        if (handlePermissions()) {

            // Suppress the warning as it is already handling the permission checking
            @SuppressLint("MissingPermission")
            Location location = locationManager.getLastKnownLocation(provider);

            result = new LatLng(location.getLatitude(), location.getLongitude());
        }

        return result;
    }
}

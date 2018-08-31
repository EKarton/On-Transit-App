package com.kartonoe.ontransitapp;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Criteria;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.FragmentActivity;
import android.util.Log;
import android.view.View;
import android.widget.TextView;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.CameraPosition;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Polyline;
import com.google.android.gms.maps.model.PolylineOptions;
import com.kartonoe.ontransitapp.models.Route;
import com.kartonoe.ontransitapp.models.RouteAPIGateway;
import com.kartonoe.ontransitapp.models.Vector;

import java.util.List;

public class MainActivity extends FragmentActivity implements OnMapReadyCallback {

    private TextView routeShortNameLabel;
    private TextView routeLongNameLabel;
    private TextView routeDirectionLabel;

    private GoogleMap mMap;
    private LocationManager locationManager;
    private LocationListener locationListener;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);

        // Get the UI components
        this.routeShortNameLabel = findViewById(R.id.routeShortNameLabel);
        this.routeLongNameLabel = findViewById(R.id.routeLongNameLabel);
        this.routeDirectionLabel = findViewById(R.id.routeDirectionLabel);

        // Add a click listener on location button
        FloatingActionButton resetLocationButton = findViewById(R.id.resetLocationButton);
        resetLocationButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                requestLocation();
            }
        });

        this.locationManager = (LocationManager)
                getSystemService(Context.LOCATION_SERVICE);

        this.locationListener = new LocationListener() {
            @Override
            public void onLocationChanged(Location location) {
                Log.d("Main Activity", "Location changed!");
                Vector vectorLocation = new Vector(location.getLatitude(), location.getLongitude());
                updateRoutes(vectorLocation);
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

    @Override
    public void onMapReady(GoogleMap googleMap) {
        mMap = googleMap;
        mMap.setBuildingsEnabled(true);

        String provider = locationManager.getBestProvider(new Criteria(), false);
        if (handlePermissions()) {

            // Suppress the warning as it is already handling the permission checking
            @SuppressLint("MissingPermission")
            Location location = locationManager.getLastKnownLocation(provider);

            updateRoutes(new Vector(location.getLatitude(), location.getLongitude()));
        }
    }

    @SuppressLint("MissingPermission")
    private void requestLocation(){
        if (handlePermissions()){
            locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 5000, 5, locationListener);
        }
    }

    private boolean handlePermissions(){
        boolean isGranted = handlePermissions(Manifest.permission.ACCESS_FINE_LOCATION) &&
                handlePermissions(Manifest.permission.ACCESS_COARSE_LOCATION) &&
                handlePermissions(Manifest.permission.INTERNET);

        return isGranted;
    }

    private boolean handlePermissions(String permission) {

        // Check to see if the permission is already granted
        if (ActivityCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {

            // Check to see if the user has declined the permission already
            if (ActivityCompat.shouldShowRequestPermissionRationale(this, permission)) {

                // We need to explain to the user why we need this permission
                return false;
            }
            else {

                // Ask the user to accept the permission
                ActivityCompat.requestPermissions(this, new String[] { permission }, 1);
                return handlePermissions();
            }
        }
        else {
            return true;
        }
    }

    private void updateRoutes(Vector curLocation){
        RouteAPIGateway apiGateway = RouteAPIGateway.getInstance();
        List<Route> routesNearMe = apiGateway.getRoutesNearLocation(curLocation, 5);
        List<Vector> path = apiGateway.getPath(routesNearMe.get(0));
        updateMaps(curLocation, routesNearMe.get(0), path);
    }

    private void updateMaps(Vector curLocation, Route newRoute, List<Vector> path){

        // Update the top header
        this.routeShortNameLabel.setText(newRoute.getRouteShortName());
        this.routeLongNameLabel.setText(newRoute.getRouteLongName());
        this.routeDirectionLabel.setText(newRoute.getRouteDirection());

        // Change the path in google maps
        PolylineOptions polylineOptions = new PolylineOptions();
        for (Vector point : path){
            polylineOptions.add(new LatLng(point.getX(), point.getY()));
        }
        Polyline polyline = mMap.addPolyline(polylineOptions);

        // Change the camera
        CameraPosition newCameraPosition = new CameraPosition.Builder()
                .target(new LatLng(curLocation.getX(), curLocation.getY()))
                .zoom(20) // Show buildings
                .tilt(65)
                //.bearing() The direction
                .build();
        mMap.moveCamera(CameraUpdateFactory.newCameraPosition(newCameraPosition));
    }
}

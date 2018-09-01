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
import android.widget.ListView;

import com.android.volley.VolleyError;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.CameraPosition;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.maps.model.Polyline;
import com.google.android.gms.maps.model.PolylineOptions;
import com.kartonoe.ontransitapp.models.Route;
import com.kartonoe.ontransitapp.services.GetRouteDetailsHandler;
import com.kartonoe.ontransitapp.services.GetRoutesHandler;
import com.kartonoe.ontransitapp.services.OnTransitMockService;
import com.kartonoe.ontransitapp.models.Stop;
import com.kartonoe.ontransitapp.models.Vector;
import com.kartonoe.ontransitapp.services.OnTransitService;
import com.kartonoe.ontransitapp.services.OnTransitWebService;
import com.kartonoe.ontransitapp.views.RouteDetailsView;
import com.sothree.slidinguppanel.SlidingUpPanelLayout;

import java.util.List;

public class MainActivity extends FragmentActivity implements OnMapReadyCallback {

    private ListView stopsListView;

    private GoogleMap mMap;
    private LocationManager locationManager;
    private LocationListener locationListener;

    private StopsAdapter stopsAdapter;
    private RouteDetailsView routeDetailsView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);

        // Get the UI components
        this.routeDetailsView = findViewById(R.id.routeDetails);
        this.stopsListView = findViewById(R.id.stopsListView);

        // Fix the drag and scrolling with the listview in the sliding panel
        SlidingUpPanelLayout scrollPanel = findViewById(R.id.sliding_layout);
        scrollPanel.setScrollableView(this.stopsListView);

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
                updateRoutes(new LatLng(location.getLatitude(), location.getLongitude()));
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

            if (location != null) {
                updateRoutes(new LatLng(location.getLatitude(), location.getLongitude()));
            }
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

    private void updateRoutes(LatLng curLocation){
        final LatLng currentLocation = curLocation;
        final OnTransitService service = OnTransitWebService.getInstance(this);

        service.getRoutesNearLocation(curLocation, 500, new GetRoutesHandler() {
            @Override
            public void onSuccess(List<String> routeIDs) {

                service.getRouteDetails(routeIDs.get(0), new GetRouteDetailsHandler() {
                    @Override
                    public void onSuccess(Route route) {
                        updateRouteDetailsUI(route);
                        updateStopsUI(route.getNextStops());
                        updateMapsUI(currentLocation, route.getPath(), route.getNextStops());
                    }

                    @Override
                    public void onError(int errorCode, String errorMessage) {

                    }
                });

            }

            @Override
            public void onError(int errorCode, String errorMessage) {

            }
        });
    }

    private void updateRouteDetailsUI(Route newRoute){
        this.routeDetailsView.setRoute(newRoute);
    }

    private void updateStopsUI(List<Stop> stops){
        if (stopsAdapter == null){
            stopsAdapter = new StopsAdapter(this, stops);
        }
        else{
            this.stopsAdapter.clear();
            this.stopsAdapter.addAll(stops);
        }

        stopsListView.setAdapter(this.stopsAdapter);
    }

    private void updateMapsUI(LatLng curLocation, List<Vector> path, List<Stop> stops){
        mMap.clear();

        // Change the path in google maps
        PolylineOptions polylineOptions = new PolylineOptions();
        for (Vector point : path){
            polylineOptions.add(new LatLng(point.getX(), point.getY()));
        }
        Polyline polyline = mMap.addPolyline(polylineOptions);

        // Change the stops
        for (Stop stop : stops){
            LatLng latLng = new LatLng(stop.getLocation().getX(), stop.getLocation().getY());

            MarkerOptions markerOptions = new MarkerOptions()
                    .position(latLng)
                    .title(stop.getName())
                    .draggable(false);
            mMap.addMarker(markerOptions);
        }

        // Change the camera
        CameraPosition newCameraPosition = new CameraPosition.Builder()
                .target(new LatLng(curLocation.latitude, curLocation.longitude))
                .zoom(20) // Show buildings
                .tilt(65)
                //.bearing() The direction
                .build();
        mMap.moveCamera(CameraUpdateFactory.newCameraPosition(newCameraPosition));
    }
}

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
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.util.Log;
import android.view.View;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.CameraPosition;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.maps.model.Polyline;
import com.google.android.gms.maps.model.PolylineOptions;
import com.kartonoe.ontransitapp.models.NearbyTrip;
import com.kartonoe.ontransitapp.models.Stop;
import com.kartonoe.ontransitapp.models.Trip;
import com.kartonoe.ontransitapp.models.Vector;
import com.kartonoe.ontransitapp.services.GetTripDetailsHandler;
import com.kartonoe.ontransitapp.services.OnTransitService;
import com.kartonoe.ontransitapp.services.OnTransitWebService;
import com.kartonoe.ontransitapp.views.NearbyTripsPickerDialog;
import com.kartonoe.ontransitapp.views.StopDetailsAdapter;
import com.kartonoe.ontransitapp.views.TripDetailsView;
import com.sothree.slidinguppanel.SlidingUpPanelLayout;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.TimeZone;
import java.util.Timer;
import java.util.TimerTask;

public class MainActivity extends FragmentActivity implements OnMapReadyCallback {

    private RecyclerView stopsRecyclerView;

    private GoogleMap mMap;
    private LocationManager locationManager;
    private LocationListener locationListener;

    private TripDetailsView tripDetailsView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);

        // Get the UI components
        this.tripDetailsView = findViewById(R.id.routeDetails);
        this.stopsRecyclerView = findViewById(R.id.stopsRecyclerView);

        Timer timer = new Timer();
        timer.schedule(new TimerTask() {
            @Override
            public void run() {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (stopsRecyclerView.getAdapter() != null) {
                            stopsRecyclerView.getAdapter().notifyDataSetChanged();
                        }
                    }
                });
            }
        }, 0, 1000);

        // Fix the drag and scrolling with the listview in the sliding panel
        SlidingUpPanelLayout scrollPanel = findViewById(R.id.sliding_layout);
        scrollPanel.setScrollableView(this.stopsRecyclerView);

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

        NearbyTripsPickerDialog dialog = new NearbyTripsPickerDialog(this, OnTransitWebService.getInstance(this), new NearbyTripsPickerDialog.OnTripSelectedListener() {
            @Override
            public void onTripSelected(NearbyTrip nearbyTrip) {
                selectTripSchedule(nearbyTrip);
            }
        });
        dialog.show();
    }

    public void selectTripSchedule(NearbyTrip trip) {
        final OnTransitService service = OnTransitWebService.getInstance(this);

        service.getTripDetails(trip.getTripID(), trip.getScheduleID(), new GetTripDetailsHandler() {
            @Override
            public void onSuccess(Trip trip) {

                // Get the current time in seconds from midnight
                Calendar curTime = Calendar.getInstance(TimeZone.getDefault());
                int numHoursFromMidnight = curTime.get(Calendar.HOUR_OF_DAY);
                int numMinutesFromHour = curTime.get(Calendar.MINUTE);
                int numSecondsFromMin = curTime.get(Calendar.SECOND);
                Log.d("MainActivity", "Time " + numHoursFromMidnight + ":" + numMinutesFromHour + ":" + numSecondsFromMin);
                int numSecondsFromMidnight = numSecondsFromMin + (60 * numMinutesFromHour) + (3600 * numHoursFromMidnight);

                // Get the stops that are still pending
                List<Stop> incomingStops = new ArrayList<>();
                for (Stop stop : trip.getNextStops()) {
                    if (numSecondsFromMidnight < stop.getArrivalTime()){
                        incomingStops.add(stop);
                    }
                }

                Log.d("MainActivity", "Num stops left: " + incomingStops.size());

                String provider = locationManager.getBestProvider(new Criteria(), false);
                if (handlePermissions()) {

                    // Suppress the warning as it is already handling the permission checking
                    @SuppressLint("MissingPermission")
                    Location location = locationManager.getLastKnownLocation(provider);

                    if (location != null) {
                        LatLng latLng = new LatLng(location.getLatitude(), location.getLongitude());
                        updateTripDetailsUI(trip);
                        updateStopsUI(incomingStops);
                        updateMapsUI(latLng, trip.getPath(), incomingStops);
                    }
                }
            }

            @Override
            public void onError(Exception exception) {

            }
        });
    }

    @SuppressLint("MissingPermission")
    private void requestLocation(){
        if (handlePermissions()){
            locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 5000, 5, locationListener);
        }
    }

    private boolean handlePermissions(){
        return handlePermissions(Manifest.permission.ACCESS_FINE_LOCATION) &&
                handlePermissions(Manifest.permission.ACCESS_COARSE_LOCATION) &&
                handlePermissions(Manifest.permission.INTERNET);
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

    private void updateTripDetailsUI(Trip newTrip){
        this.tripDetailsView.setRoute(newTrip);
    }

    private void updateStopsUI(List<Stop> stops){
        StopDetailsAdapter stopDetailsAdapter = new StopDetailsAdapter(stops, new StopDetailsAdapter.OnAlarmCreatedListener() {
            @Override
            public void createAlarm(Stop stop) {
            }
        });
        stopsRecyclerView.setAdapter(stopDetailsAdapter);
        stopsRecyclerView.setLayoutManager(new LinearLayoutManager(this));
    }

    private void updateMapsUI(LatLng curLocation, List<Vector> path, List<Stop> stops){
        mMap.clear();

        // Change the path in google maps
        PolylineOptions polylineOptions = new PolylineOptions();
        for (Vector point : path){
            polylineOptions.add(new LatLng(point.getY(), point.getX()));
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

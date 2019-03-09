package com.ontransit.androidapp.views;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.v4.app.FragmentActivity;
import android.support.v7.widget.LinearLayoutManager;
import android.util.Log;
import android.view.View;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.CameraPosition;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.maps.model.PolylineOptions;
import com.ontransit.androidapp.R;
import com.ontransit.androidapp.models.NearbyTrip;
import com.ontransit.androidapp.models.Stop;
import com.ontransit.androidapp.models.Trip;
import com.ontransit.androidapp.services.GetTripDetailsHandler;
import com.ontransit.androidapp.services.LocationServices;
import com.ontransit.androidapp.services.OnTransitMockedWebService;
import com.ontransit.androidapp.services.OnTransitService;
import com.ontransit.androidapp.services.StopAlarmsManager;
import com.ontransit.androidapp.views.nearbytrips.NearbyTripsPickerDialog;
import com.ontransit.androidapp.views.stopdetails.OnAlarmCreatedListener;
import com.ontransit.androidapp.views.stopdetails.StopDetailsAdapter;
import com.ontransit.androidapp.views.stopdetails.StopDetailsListItemData;
import com.ontransit.androidapp.views.stopdetails.StopDetailsRecyclerView;
import com.sothree.slidinguppanel.SlidingUpPanelLayout;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.TimeZone;

public class MapsActivity extends FragmentActivity implements OnMapReadyCallback {

    private StopDetailsRecyclerView stopsRecyclerView;

    private GoogleMap mMap;

    private TripDetailsView tripDetailsView;
    private StopAlarmsManager stopAlarmManager;
    private OnTransitService onTransitService;
    private LocationServices locationServices;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_maps);

        stopAlarmManager = new StopAlarmsManager(this);
        onTransitService = OnTransitMockedWebService.getInstance(this);
        locationServices = new LocationServices(this);

        setupUI();
    }

    public void setupUI() {
        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);

        // Get the UI components
        this.tripDetailsView = findViewById(R.id.routeDetails);
        this.stopsRecyclerView = findViewById(R.id.stopsRecyclerView);

        // Fix the drag and scrolling with the listview in the sliding panel
        SlidingUpPanelLayout scrollPanel = findViewById(R.id.sliding_layout);
        scrollPanel.setScrollableView(this.stopsRecyclerView);

        // Add a click listener on location button
        FloatingActionButton resetLocationButton = findViewById(R.id.resetLocationButton);
        resetLocationButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
            }
        });
    }

    @Override
    public void onMapReady(GoogleMap googleMap) {
        mMap = googleMap;
        mMap.setBuildingsEnabled(true);

        Intent intent = getIntent();

        if (intent.getBooleanExtra("hasSelectedTrip", false)) {
            String tripID = intent.getStringExtra("tripID");
            String scheduleID = intent.getStringExtra("scheduleID");

            NearbyTrip nearbyTrip = new NearbyTrip(tripID, null, null, null, null, scheduleID);
            selectTripSchedule(nearbyTrip);

        } else {
            NearbyTripsPickerDialog dialog = new NearbyTripsPickerDialog(this, onTransitService, new NearbyTripsPickerDialog.OnTripSelectedListener() {
                @Override
                public void onTripSelected(NearbyTrip nearbyTrip) {
                    selectTripSchedule(nearbyTrip);
                }
            });
            dialog.show();
        }
    }

    public void selectTripSchedule(NearbyTrip trip) {
        final String tripID = trip.getTripID();
        final String scheduleID = trip.getScheduleID();

        onTransitService.getTripDetails(tripID, scheduleID, new GetTripDetailsHandler(scheduleID) {
            @Override
            public void onSuccess(Trip trip) {

                LatLng curLocation = locationServices.getLastKnownLocation();

                if (curLocation != null) {
                    updateTripDetailsUI(trip);
                    updateStopsUI(trip);
                    updateMapsUI(curLocation, trip.getPath(), trip.getStops());
                }
            }

            @Override
            public void onError(Exception exception) {

            }
        });
    }

    private void updateTripDetailsUI(Trip newTrip){
        this.tripDetailsView.setRoute(newTrip);
    }

    private void updateStopsUI(Trip newTrip){
        final String tripID = newTrip.getTripID();
        final String scheduleID = newTrip.getScheduleID();
        final List<Stop> stops = newTrip.getStops();

        OnAlarmCreatedListener listener = new OnAlarmCreatedListener() {
            @Override
            public void createAlarm(Stop stop) {

                if (stopAlarmManager.isAlarmCreated(stop)) {
                    stopAlarmManager.deleteAlarm(stop);
                } else {
                    stopAlarmManager.addAlarm(stop, tripID, scheduleID);
                }
            }
        };

        // Get the current time in seconds from midnight
        Calendar curTime = Calendar.getInstance(TimeZone.getDefault());
        int numHoursFromMidnight = curTime.get(Calendar.HOUR_OF_DAY);
        int numMinutesFromHour = curTime.get(Calendar.MINUTE);
        int numSecondsFromMin = curTime.get(Calendar.SECOND);
        Log.d("MainActivity", "Time " + numHoursFromMidnight + ":" + numMinutesFromHour + ":" + numSecondsFromMin);
        int numSecondsFromMidnight = numSecondsFromMin + (60 * numMinutesFromHour) + (3600 * numHoursFromMidnight);

        // Get the stops that are still pending
        List<StopDetailsListItemData> stopDetailsList = new ArrayList<>();
        for (Stop stop : stops) {
            if (numSecondsFromMidnight < stop.getArrivalTime()){
                stopDetailsList.add(new StopDetailsListItemData(stop, listener));
            }
        }

        StopDetailsAdapter stopDetailsAdapter = new StopDetailsAdapter(stopDetailsList);
        stopsRecyclerView.setAdapter(stopDetailsAdapter);
        stopsRecyclerView.setLayoutManager(new LinearLayoutManager(this));
    }

    private void updateMapsUI(LatLng curLocation, List<LatLng> path, List<Stop> stops){
        mMap.clear();

        // Change the path in google maps
        PolylineOptions polylineOptions = new PolylineOptions()
                .addAll(path)
                .color(Color.BLUE)
                .width(5);
        mMap.addPolyline(polylineOptions);

        // Change the stops
        for (Stop stop : stops){
            MarkerOptions markerOptions = new MarkerOptions()
                    .position(stop.getLocation())
                    .title(stop.getName())
                    .draggable(false);

            mMap.addMarker(markerOptions);
        }

        // Change the camera
        LatLng cameraLocation = curLocation;
        if (stops.size() > 0) {

            // Get the avg. latitude and longitude of all stop locations
            double avgLatitudeOfStop = 0;
            double avgLongitudeOfStop = 0;
            for (Stop stop : stops) {
                avgLatitudeOfStop += stop.getLocation().latitude;
                avgLongitudeOfStop += stop.getLocation().longitude;
            }
            avgLatitudeOfStop /= stops.size();
            avgLongitudeOfStop /= stops.size();

            cameraLocation = new LatLng(avgLatitudeOfStop, avgLongitudeOfStop);
        }
        CameraPosition newCameraPosition = new CameraPosition.Builder()
                .target(cameraLocation)
                .zoom(15) // Show streets
                .tilt(0)
                //.bearing() The direction
                .build();
        mMap.moveCamera(CameraUpdateFactory.newCameraPosition(newCameraPosition));
    }
}

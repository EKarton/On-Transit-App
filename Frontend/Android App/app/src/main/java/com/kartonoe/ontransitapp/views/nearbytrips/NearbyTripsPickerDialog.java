package com.kartonoe.ontransitapp.views.nearbytrips;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Dialog;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.support.v4.app.ActivityCompat;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ListView;

import com.google.android.gms.maps.model.LatLng;
import com.kartonoe.ontransitapp.R;
import com.kartonoe.ontransitapp.models.NearbyTrip;
import com.kartonoe.ontransitapp.services.GetNearbyTripsHandler;
import com.kartonoe.ontransitapp.services.OnTransitService;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class NearbyTripsPickerDialog extends Dialog {

    public interface OnTripSelectedListener {
        void onTripSelected(NearbyTrip nearbyTrip);
    }

    public interface OnCancelledListener {
        void onCancel();
    }

    private final OnTransitService onTransitService;
    private final OnTripSelectedListener onTripSelectedListener;
    private final OnCancelledListener onCancelledListener;
    private LocationManager locationManager;
    private LocationListener locationListener;

    private ListView nearbyTripsListView;
    private NearbyTripsPickerAdapter nearbyTripArrayAdapter;

    public NearbyTripsPickerDialog(Context context, OnTransitService onTransitService, OnTripSelectedListener onTripSelectedListener) {
        this(context, onTransitService, onTripSelectedListener, null);
    }

    public NearbyTripsPickerDialog(Context context, OnTransitService onTransitService, OnTripSelectedListener onTripSelectedListener, OnCancelledListener onCancelledListener) {
        super(context);
        this.onTransitService = onTransitService;
        this.onTripSelectedListener = onTripSelectedListener;
        this.onCancelledListener = onCancelledListener;

        View view = LayoutInflater.from(this.getContext()).inflate(R.layout.nearby_trips_picker_dialog, null, false);
        this.setContentView(view);
    }

    @Override
    public void show() {
        super.show();
        this.nearbyTripsListView = findViewById(R.id.nearbyTripsListView);
        this.nearbyTripsListView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                NearbyTripsPickerDialog.super.dismiss();
                NearbyTrip selectedNearbyTrip = nearbyTripArrayAdapter.getItem(position);
                onTripSelectedListener.onTripSelected(selectedNearbyTrip);
            }
        });

        this.locationManager = (LocationManager)
                this.getContext().getSystemService(Context.LOCATION_SERVICE);

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
    public void dismiss() {
        if (onCancelledListener != null) {
            super.dismiss();
            this.onCancelledListener.onCancel();
        }
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
        if (ActivityCompat.checkSelfPermission(this.getContext(), permission) != PackageManager.PERMISSION_GRANTED) {

            // Check to see if the user has declined the permission already
            if (ActivityCompat.shouldShowRequestPermissionRationale(this.getOwnerActivity(), permission)) {

                // We need to explain to the user why we need this permission
                return false;
            }
            else {

                // Ask the user to accept the permission
                ActivityCompat.requestPermissions(this.getOwnerActivity(), new String[] { permission }, 1);
                return handlePermissions();
            }
        }
        else {
            return true;
        }
    }

    private void updateRoutes(LatLng curLocation) {

        SimpleDateFormat format = new SimpleDateFormat("HH:mm:ss", Locale.CANADA);
        Date curTime = Calendar.getInstance().getTime();
        String formattedTime = format.format(curTime);

        onTransitService.getTripIDsNearLocation(curLocation, 500, formattedTime, new GetNearbyTripsHandler() {
            @Override
            public void onSuccess(List<NearbyTrip> localNearbyTrips) {
                findViewById(R.id.loadingPanel).setVisibility(View.GONE);
                findViewById(R.id.tripResultsPanel).setVisibility(View.VISIBLE);

                if (nearbyTripArrayAdapter == null){
                    nearbyTripArrayAdapter = new NearbyTripsPickerAdapter(getContext(), localNearbyTrips);
                }
                else{
                    nearbyTripArrayAdapter.clear();
                    nearbyTripArrayAdapter.addAll(localNearbyTrips);
                }

                nearbyTripsListView.setAdapter(nearbyTripArrayAdapter);
            }

            @Override
            public void onError(Exception exception) {

            }
        });
    }
}

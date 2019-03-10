package com.ontransit.androidapp.views.nearbytrips;

import android.app.Dialog;
import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ListView;

import com.google.android.gms.maps.model.LatLng;
import com.ontransit.androidapp.R;
import com.ontransit.androidapp.models.NearbyTrip;
import com.ontransit.androidapp.services.GetNearbyTripsHandler;
import com.ontransit.androidapp.services.LocationServices;
import com.ontransit.androidapp.services.OnTransitService;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class NearbyTripsPickerDialog extends Dialog {

    private final LocationServices locationServices;
    private final NearbyTripsPickerDialogListener eventListener;
    private final OnTransitService onTransitService;

    private ListView nearbyTripsListView;
    private NearbyTripsPickerAdapter nearbyTripArrayAdapter;

    public NearbyTripsPickerDialog(Context context, OnTransitService onTransitService, LocationServices locationServices, NearbyTripsPickerDialogListener listener) {
        super(context);
        this.onTransitService = onTransitService;
        this.eventListener = listener;
        this.locationServices = locationServices;

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
                eventListener.onTripSelected(selectedNearbyTrip);
            }
        });

        locationServices.addLocationListener(new LocationListener() {
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
        });
        locationServices.requestLocation();
    }

    @Override
    public void dismiss() {
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

                } else {
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

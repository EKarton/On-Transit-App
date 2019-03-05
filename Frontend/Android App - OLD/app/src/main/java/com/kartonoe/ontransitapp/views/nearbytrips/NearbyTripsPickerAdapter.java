package com.kartonoe.ontransitapp.views.nearbytrips;

import android.content.Context;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;

import com.kartonoe.ontransitapp.R;
import com.kartonoe.ontransitapp.models.NearbyTrip;

import java.util.List;

public class NearbyTripsPickerAdapter extends ArrayAdapter<NearbyTrip> {
    private final static String TRIP_DISPLAY_FORMAT = "%s %s (%s)";

    private final Context context;
    private final List<NearbyTrip> nearbyTrips;

    NearbyTripsPickerAdapter(@NonNull Context context, @NonNull List<NearbyTrip> nearbyTrips) {
        super(context, 0, nearbyTrips);

        this.context = context;
        this.nearbyTrips = nearbyTrips;
    }

    @NonNull
    @Override
    public View getView(int position, @Nullable View convertView, @NonNull ViewGroup parent) {
        View listItem = convertView;
        if (listItem == null)
            listItem = LayoutInflater.from(this.context).inflate(R.layout.nearby_trips_picker_listitem, parent, false);

        NearbyTrip curNearbyTrip = this.nearbyTrips.get(position);
        String displayString = String.format(TRIP_DISPLAY_FORMAT,
                curNearbyTrip.getShortName(),
                curNearbyTrip.getLongName(),
                curNearbyTrip.getHeadSign());

        TextView textView = listItem.findViewById(R.id.nearbyTripName);
        textView.setText(displayString);

        return listItem;
    }
}

package com.kartonoe.ontransitapp;

import android.content.Context;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;

import com.kartonoe.ontransitapp.models.Stop;

import java.util.Calendar;
import java.util.List;

public class StopsAdapter extends ArrayAdapter<Stop> {
    private final List<Stop> stops;
    private final Context context;

    /**
     * Constructor
     *
     * @param context  The current context.
     * @param stops  The stops shown in the ListView.
     */
    public StopsAdapter(@NonNull Context context, @NonNull List<Stop> stops) {
        super(context, 0, stops);

        this.context = context;
        this.stops = stops;
    }

    @NonNull
    @Override
    public View getView(int position, @Nullable View convertView, @NonNull ViewGroup parent) {
        View listItem = convertView;
        if(listItem == null)
            listItem = LayoutInflater.from(this.context).inflate(R.layout.stop_detail_view, parent, false);

        Stop currentStop = this.stops.get(position);

        // Get the time between now and the stop's arrival time
        Calendar curTime = Calendar.getInstance();
        int numHoursFromMidnight = curTime.get(Calendar.HOUR_OF_DAY);
        int numMinutesFromHour = curTime.get(Calendar.MINUTE);
        int numSecondsFromMin = curTime.get(Calendar.SECOND);
        int numSecondsFromMidnight = numSecondsFromMin + (60 * numMinutesFromHour) + (3600 * numHoursFromMidnight);
        int secondsDiff = currentStop.getExpectedArrivalTime() - numSecondsFromMidnight;

        // Compute the time difference in minutes
        int numHoursLeft = secondsDiff / 3600;
        secondsDiff -= numHoursLeft * 3600;
        int numMinutesLeft = secondsDiff / 60;

        // Change the UI text
        TextView stopNameLabel = listItem.findViewById(R.id.stopNameLabel);
        stopNameLabel.setText(currentStop.getName());

        TextView stopTimeValueLabel = listItem.findViewById(R.id.stopTimeValueLabel);
        stopTimeValueLabel.setText(numMinutesLeft + "");

        TextView stopTimeUnitLabel = listItem.findViewById(R.id.stopTimeUnitLabel);
        stopTimeUnitLabel.setText("minutes");

        return listItem;
    }
}

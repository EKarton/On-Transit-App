package com.kartonoe.ontransitapp.views.stopdetails;

import android.content.Context;
import android.support.annotation.NonNull;
import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.kartonoe.ontransitapp.R;
import com.kartonoe.ontransitapp.models.Stop;

import java.util.ArrayList;
import java.util.List;

public class StopDetailsAdapter extends RecyclerView.Adapter<StopDetailsViewHolder> {

    private List<Stop> stops;
    private final OnAlarmCreatedListener onAlarmCreatedListener;

    public interface OnAlarmCreatedListener {
        void createAlarm(Stop stop);
    }

    private final List<StopDetailsListItemData> stopsListItems = new ArrayList<>();

    public StopDetailsAdapter(List<Stop> stops, OnAlarmCreatedListener onAlarmCreatedListener) {
        this.stops = stops;
        this.onAlarmCreatedListener = onAlarmCreatedListener;
        setStops(stops);
    }

    public List<Stop> getStops() {
        return stops;
    }

    public void setStops(List<Stop> stops) {
        this.stops = stops;

        stopsListItems.clear();
        for (Stop stop : stops) {
            stopsListItems.add(new StopDetailsListItemData(stop, onAlarmCreatedListener));
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public StopDetailsViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int i) {
        Context context = viewGroup.getContext();

        // Inflate the custom layout
        View stopDetailsView = LayoutInflater.from(context)
                .inflate(R.layout.stop_detail_view, viewGroup, false);

        return new StopDetailsViewHolder(stopDetailsView);
    }

    @Override
    public void onBindViewHolder(@NonNull StopDetailsViewHolder stopDetailsViewHolder, int i) {
        StopDetailsListItemData stop = this.stopsListItems.get(i);
        stopDetailsViewHolder.bind(stop);
    }

    @Override
    public int getItemCount() {
        return this.stopsListItems.size();
    }
}

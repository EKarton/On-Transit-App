package com.ontransit.androidapp.views.stopdetails;

import android.content.Context;
import android.support.annotation.NonNull;
import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.ontransit.androidapp.R;

import java.util.List;

public class StopDetailsAdapter extends RecyclerView.Adapter<StopDetailsViewHolder> {

    private List<StopDetailsListItemData> stopsListItems;

    public StopDetailsAdapter(List<StopDetailsListItemData> stopsListItems) {
        this.stopsListItems = stopsListItems;
    }

    public List<StopDetailsListItemData> getStopsListItems() {
        return stopsListItems;
    }

    public void setStopsListItems(List<StopDetailsListItemData> stopsListItems) {
        this.stopsListItems = stopsListItems;
        this.notifyDataSetChanged();
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

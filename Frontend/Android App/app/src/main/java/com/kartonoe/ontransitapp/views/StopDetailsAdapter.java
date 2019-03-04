package com.kartonoe.ontransitapp.views;

import android.content.Context;
import android.support.annotation.NonNull;
import android.support.constraint.ConstraintLayout;
import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import com.kartonoe.ontransitapp.R;
import com.kartonoe.ontransitapp.models.Stop;
import com.kartonoe.ontransitapp.utils.RemainingTime;
import com.kartonoe.ontransitapp.utils.RemainingTimeFormatter;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

public class StopDetailsAdapter extends RecyclerView.Adapter<StopDetailsAdapter.ViewHolder> {

    public interface OnAlarmCreatedListener {
        void createAlarm(Stop stop);
    }

    class ViewHolder extends RecyclerView.ViewHolder {

        private final TextView stopNameLabel;
        private final TextView stopTimeValueLabel;
        private final TextView stopTimeUnitLabel;
        private final Button notifyButton;
        private final ConstraintLayout notifyPanel;

        ViewHolder(@NonNull View itemView) {
            super(itemView);

            stopNameLabel = itemView.findViewById(R.id.stopNameLabel);
            stopTimeValueLabel = itemView.findViewById(R.id.stopTimeValueLabel);
            stopTimeUnitLabel = itemView.findViewById(R.id.stopTimeUnitLabel);
            notifyPanel = itemView.findViewById(R.id.notifyStopPanel);
            notifyButton = itemView.findViewById(R.id.notifyStopButton);
        }

        TextView getStopNameLabel() {
            return stopNameLabel;
        }

        TextView getStopTimeValueLabel() {
            return stopTimeValueLabel;
        }

        TextView getStopTimeUnitLabel() {
            return stopTimeUnitLabel;
        }

        ConstraintLayout getNotifyPanel() {
            return notifyPanel;
        }

        void bind(final StopDetailsListItemData stop) {

            // Get the time between now and the stop's arrival time
            Calendar curTime = Calendar.getInstance();
            int numHoursFromMidnight = curTime.get(Calendar.HOUR_OF_DAY);
            int numMinutesFromHour = curTime.get(Calendar.MINUTE);
            int numSecondsFromMin = curTime.get(Calendar.SECOND);
            int numSecondsFromMidnight = numSecondsFromMin + (60 * numMinutesFromHour) + (3600 * numHoursFromMidnight);
            int secondsDiff = stop.getStop().getArrivalTime() - numSecondsFromMidnight;

            RemainingTime remainingTime = RemainingTimeFormatter.getFormattedTime(secondsDiff);

            this.getStopNameLabel().setText(stop.getStop().getName());
            this.getStopTimeValueLabel().setText(remainingTime.getValue());
            this.getStopTimeUnitLabel().setText(remainingTime.getUnits());

            if (stop.isSelected()) {
                this.getNotifyPanel().setVisibility(View.VISIBLE);
            } else {
                this.getNotifyPanel().setVisibility(View.GONE);
            }

            itemView.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    stop.setSelected(!stop.isSelected());

                    if (stop.isSelected()) {
                        getNotifyPanel().setVisibility(View.VISIBLE);
                    } else {
                        getNotifyPanel().setVisibility(View.GONE);
                    }
                }
            });

            notifyButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    stop.getOnAlarmCreatedListener().createAlarm(stop.getStop());
                }
            });
        }
    }

    private class StopDetailsListItemData {
        private final Stop stop;
        private OnAlarmCreatedListener onAlarmCreatedListener;
        private boolean isSelected = false;

        StopDetailsListItemData(Stop stop, OnAlarmCreatedListener onAlarmCreatedListener) {
            this.stop = stop;
            this.onAlarmCreatedListener = onAlarmCreatedListener;
        }

        Stop getStop() {
            return stop;
        }

        boolean isSelected() {
            return isSelected;
        }

        void setSelected(boolean selected) {
            isSelected = selected;
        }

        OnAlarmCreatedListener getOnAlarmCreatedListener() {
            return onAlarmCreatedListener;
        }
    }

    private final List<StopDetailsListItemData> stopsListItems = new ArrayList<>();

    public StopDetailsAdapter(List<Stop> stops, OnAlarmCreatedListener onAlarmCreatedListener) {
        for (Stop stop : stops) {
            stopsListItems.add(new StopDetailsListItemData(stop, onAlarmCreatedListener));
        }
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int i) {
        Context context = viewGroup.getContext();

        // Inflate the custom layout
        View stopDetailsView = LayoutInflater.from(context)
                .inflate(R.layout.stop_detail_view, viewGroup, false);

        return new ViewHolder(stopDetailsView);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder viewHolder, int i) {
        StopDetailsListItemData stop = this.stopsListItems.get(i);
        viewHolder.bind(stop);
    }

    @Override
    public int getItemCount() {
        return this.stopsListItems.size();
    }
}

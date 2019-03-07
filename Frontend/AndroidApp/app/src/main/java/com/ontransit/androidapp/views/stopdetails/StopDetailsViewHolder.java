package com.ontransit.androidapp.views.stopdetails;

import android.support.annotation.NonNull;
import android.support.constraint.ConstraintLayout;
import android.support.v7.widget.RecyclerView;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.ontransit.androidapp.R;
import com.ontransit.androidapp.utils.RemainingTimeFormatter;
import com.ontransit.androidapp.utils.RemainingTime;

import java.util.Calendar;

public class StopDetailsViewHolder extends RecyclerView.ViewHolder {

    private final TextView stopNameLabel;
    private final TextView stopTimeValueLabel;
    private final TextView stopTimeUnitLabel;
    private final Button notifyButton;
    private final ConstraintLayout notifyPanel;

    StopDetailsViewHolder(@NonNull View itemView) {
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
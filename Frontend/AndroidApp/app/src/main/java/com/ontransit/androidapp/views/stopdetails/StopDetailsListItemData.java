package com.ontransit.androidapp.views.stopdetails;


import com.ontransit.androidapp.models.Stop;

public class StopDetailsListItemData {
    private final Stop stop;
    private OnAlarmCreatedListener onAlarmCreatedListener;
    private boolean isSelected = false;
    private boolean isAlarmCreated = false;

    public StopDetailsListItemData(Stop stop, OnAlarmCreatedListener onAlarmCreatedListener) {
        this.stop = stop;
        this.onAlarmCreatedListener = onAlarmCreatedListener;
        this.isAlarmCreated = false;
    }

    public StopDetailsListItemData(Stop stop, OnAlarmCreatedListener onAlarmCreatedListener, boolean isSelected) {
        this.stop = stop;
        this.onAlarmCreatedListener = onAlarmCreatedListener;
        this.isSelected = isSelected;
        this.isAlarmCreated = false;
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
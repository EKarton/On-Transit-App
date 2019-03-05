package com.kartonoe.ontransitapp.views.stopdetails;

import com.kartonoe.ontransitapp.models.Stop;

public class StopDetailsListItemData {
    private final Stop stop;
    private StopDetailsAdapter.OnAlarmCreatedListener onAlarmCreatedListener;
    private boolean isSelected = false;

    StopDetailsListItemData(Stop stop, StopDetailsAdapter.OnAlarmCreatedListener onAlarmCreatedListener) {
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

    StopDetailsAdapter.OnAlarmCreatedListener getOnAlarmCreatedListener() {
        return onAlarmCreatedListener;
    }
}
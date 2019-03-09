package com.ontransit.androidapp.views.stopalarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class StopAlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        Intent newIntent = new Intent(context, StopAlarmActivity.class);

        newIntent.putExtra("stopName", intent.getStringExtra("stopName"));
        newIntent.putExtra("arrivalTime", intent.getIntExtra("arrivalTime", 0));
        newIntent.putExtra("tripID", intent.getStringExtra("tripID"));
        newIntent.putExtra("scheduleID", intent.getStringExtra("scheduleID"));
        newIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        context.startActivity(newIntent);
    }
}

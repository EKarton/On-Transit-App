package com.ontransit.androidapp.services;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;

import com.ontransit.androidapp.models.Stop;
import com.ontransit.androidapp.views.stopalarm.StopAlarmReceiver;

import java.util.HashMap;
import java.util.Map;

public class StopAlarmsManager {

    private final AlarmManager alarmManager;
    private final Context context;
    private Map<Stop, PendingIntent> stopToPendingIntent;

    public StopAlarmsManager(Context context) {
        alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        this.context = context;
        this.stopToPendingIntent = new HashMap<>();
    }

    public void addAlarm(Stop stop) {
        if (stopToPendingIntent.containsKey(stop)) {
            throw new IllegalArgumentException("Stop already exists!");
        }

        Intent newIntent = new Intent(context, StopAlarmReceiver.class);
        newIntent.putExtra("stopName", stop.getName());
        newIntent.putExtra("arrivalTime", stop.getArrivalTime());
        newIntent.putExtra("tripID", "5c4e158e3b929432766380a7");
        newIntent.putExtra("scheduleID", "5c4e14fa3b9294327663060f");

        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, newIntent, 0);
        alarmManager.set(AlarmManager.RTC_WAKEUP, 10000, pendingIntent);

        stopToPendingIntent.put(stop, pendingIntent);
    }

    public void deleteAlarm(Stop stop) {
        if (!stopToPendingIntent.containsKey(stop)) {
            throw new IllegalArgumentException("Stop does not exist yet");
        }

        PendingIntent pendingIntent = stopToPendingIntent.get(stop);
        alarmManager.cancel(pendingIntent);
    }

    public boolean isAlarmCreated(Stop stop) {
        return stopToPendingIntent.containsKey(stop);
    }

    public void clearAllAlarms() {
        for (Map.Entry<Stop, PendingIntent> pair : stopToPendingIntent.entrySet()) {
            PendingIntent pendingIntent = pair.getValue();
            alarmManager.cancel(pendingIntent);
        }
    }
}

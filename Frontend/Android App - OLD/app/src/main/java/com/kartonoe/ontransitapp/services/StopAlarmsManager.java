package com.kartonoe.ontransitapp.services;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;

import com.kartonoe.ontransitapp.models.Stop;
import com.kartonoe.ontransitapp.views.AlarmReciever;

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

        Intent newIntent = new Intent(context, AlarmReciever.class);
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

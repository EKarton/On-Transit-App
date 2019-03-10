package com.ontransit.androidapp.services;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.support.v4.app.NotificationCompat;
import android.support.v4.app.NotificationManagerCompat;
import android.widget.Toast;

import com.ontransit.androidapp.R;
import com.ontransit.androidapp.models.Stop;
import com.ontransit.androidapp.views.stopalarm.StopAlarmReceiver;

import java.util.HashMap;
import java.util.Map;

public class StopAlarmsManager {

    private static int notificationID = 0;
    private static final String CHANNEL_ID = "ontransitapp_channel_0";
    private final AlarmManager alarmManager;
    private final Context context;
    private Map<Stop, PendingIntent> stopToPendingIntent;

    public StopAlarmsManager(Context context) {
        alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        this.context = context;
        this.stopToPendingIntent = new HashMap<>();
    }

    private void createNotificationChannel() {

        // Create the NotificationChannel, but only on API 26+ because
        // the NotificationChannel class is new and not in the support library
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            String name = context.getString(R.string.channel_name);
            String description = context.getString(R.string.channel_description);
            int importance = NotificationManager.IMPORTANCE_HIGH;

            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);

            // Register the channel with the system; you can't change the importance
            // or other notification behaviors after this
            NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }

    public void addAlarm(Stop stop, String tripID, String scheduleID) {
        if (stopToPendingIntent.containsKey(stop)) {
            throw new IllegalArgumentException("Stop already exists!");
        }

        displayToast(stop);
        createAlarmDispatchedView(stop, tripID, scheduleID);
    }

    private void displayToast(Stop stop) {
        Toast.makeText(context, "Created alarm for your stop.", Toast.LENGTH_SHORT).show();
        Toast.makeText(context, "You will be notified 5 minutes before your stop", Toast.LENGTH_LONG).show();
    }

    private void createNotification(Stop stop) {
        createNotificationChannel();

        // Create a notification
        Notification notification = new NotificationCompat.Builder(this.context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher_round)
                .setContentTitle("Created alarm for your stop")
                .setContentText("You will be notified 5 minutes before your stop")
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .build();

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this.context);
        notificationManager.notify(notificationID, notification);

        notificationID ++;
    }

    private void createAlarmDispatchedView(Stop stop, String tripID, String scheduleID) {
        Intent newIntent = new Intent(context, StopAlarmReceiver.class);
        newIntent.putExtra("stopName", stop.getName());
        newIntent.putExtra("arrivalTime", stop.getArrivalTime());
        newIntent.putExtra("tripID", tripID);
        newIntent.putExtra("scheduleID", scheduleID);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, newIntent, 0);
        alarmManager.set(AlarmManager.RTC_WAKEUP, 5 * 60 * 1000, pendingIntent);

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

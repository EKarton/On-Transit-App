package com.ontransit.androidapp.views.stopalarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.ontransit.androidapp.R;
import com.ontransit.androidapp.utils.RemainingTimeFormatter;
import com.ontransit.androidapp.utils.RemainingTime;
import com.ontransit.androidapp.views.MainActivity;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

public class StopAlarmActivity extends AppCompatActivity {

    private BroadcastReceiver mTimeTickReceiver;
    private TextView currentTimeTextView;
    private TextView stopNameTextView;
    private TextView remainingTimeTextView;
    private Button dismissButton;
    private Button snoozeButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        final StopAlarmActivity currentActivity = this;

        final Intent intent = getIntent();
        final String tripID = intent.getStringExtra("tripID");
        final String scheduleID = intent.getStringExtra("scheduleID");
        final String stopName = intent.getStringExtra("stopName");
        final int arrivalTime = intent.getIntExtra("arrivalTime", 0);

        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_stop_alarm);

        // Get the UI elements
        currentTimeTextView = findViewById(R.id.currentTimeTextView);
        stopNameTextView = findViewById(R.id.stopNameTextView);
        remainingTimeTextView = findViewById(R.id.remainingTimeTextView);

        dismissButton = findViewById(R.id.dismissButton);
        snoozeButton = findViewById(R.id.snoozeButton);

        dismissButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent newIntent = new Intent(currentActivity, MainActivity.class);
                newIntent.putExtra("hasSelectedTrip", true);
                newIntent.putExtra("tripID", tripID);
                newIntent.putExtra("scheduleID", scheduleID);

                currentActivity.startActivity(newIntent);
            }
        });

        // Set the UI element's text
        currentTimeTextView.setText(getCurrentTimeToString());
        stopNameTextView.setText(stopName);
        remainingTimeTextView.setText(getRemainingTimeToString(arrivalTime));
    }

    @Override
    protected void onResume() {
        super.onResume();

        mTimeTickReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                currentTimeTextView.setText(getCurrentTimeToString());
            }
        };
        registerReceiver(mTimeTickReceiver, new IntentFilter(Intent.ACTION_TIME_TICK));
    }

    @Override
    protected void onPause() {
        super.onPause();
        unregisterReceiver(mTimeTickReceiver);
    }

    private String getCurrentTimeToString() {
        Calendar calendar = Calendar.getInstance();
        Date currentDate = calendar.getTime();

        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("hh:mm:ss a", Locale.CANADA);
        return simpleDateFormat.format(currentDate);
    }

    private String getRemainingTimeToString(int timeInSeconds) {
        Calendar curTime = Calendar.getInstance();
        int numHoursFromMidnight = curTime.get(Calendar.HOUR_OF_DAY);
        int numMinutesFromHour = curTime.get(Calendar.MINUTE);
        int numSecondsFromMin = curTime.get(Calendar.SECOND);
        int numSecondsFromMidnight = numSecondsFromMin + (60 * numMinutesFromHour) + (3600 * numHoursFromMidnight);

        int numSecondsLeft = timeInSeconds - numSecondsFromMidnight;

        RemainingTime remainingTime = RemainingTimeFormatter.getFormattedTime(numSecondsLeft);
        return remainingTime.getValue() + " " + remainingTime.getUnits();
    }
}

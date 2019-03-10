package com.ontransit.androidapp.views.stopdetails;

import android.content.Context;
import android.os.Handler;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v7.widget.RecyclerView;
import android.util.AttributeSet;

import com.ontransit.androidapp.models.Stop;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

public class StopDetailsRecyclerView extends RecyclerView {

    public interface EventHandler {
        void onTripEnds();
    }

    private List<EventHandler> eventHandlers = new ArrayList<>();
    private Timer timer = new Timer();
    private boolean isTimerRunning = false;

    public StopDetailsRecyclerView(@NonNull Context context) {
        super(context);
    }

    public StopDetailsRecyclerView(@NonNull Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
    }

    public StopDetailsRecyclerView(@NonNull Context context, @Nullable AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);
    }

    public void addEventHandler(EventHandler handler) {
        eventHandlers.add(handler);
    }

    public void removeEventHandler(EventHandler handler) {
        eventHandlers.remove(handler);
    }

    public void clearEventHandlers() {
        eventHandlers.clear();
    }

    @Override
    public void onAttachedToWindow() {
        startTimer();
        super.onAttachedToWindow();
    }

    @Override
    public void onDetachedFromWindow() {
        stopTimer();
        super.onDetachedFromWindow();
    }

    @Override
    public void setAdapter(@Nullable RecyclerView.Adapter adapter) {
        stopTimer();
        super.setAdapter(adapter);
        startTimer();
    }

    private void startTimer() {
        if (isTimerRunning) {
            return;
        }

        final Handler handler = new Handler(getContext().getMainLooper());

        // Update the time remaining per second.
        isTimerRunning = true;
        timer = new Timer();
        timer.schedule(new TimerTask() {
            @Override
            public void run() {
                handler.post(new Runnable() {
                    @Override
                    public void run() {
                        update();
                    }
                });
            }
        }, 0, 1000);
    }

    private void stopTimer() {
        if (isTimerRunning) {
            timer.cancel();
            timer.purge();
            isTimerRunning = false;
        }
    }

    private void update() {
        Adapter adapter = getAdapter();

        if (adapter instanceof StopDetailsAdapter) {
            StopDetailsAdapter stopDetailsAdapter = (StopDetailsAdapter) adapter;
            List<StopDetailsListItemData> stopList = stopDetailsAdapter.getStopsListItems();

            List<StopDetailsListItemData> stopsRemaining = new ArrayList<>();
            for (StopDetailsListItemData stopDetailsListItemData : stopList) {

                Stop stop = stopDetailsListItemData.getStop();

                // Get the time between now and the stop's arrival time
                Calendar curTime = Calendar.getInstance();
                int numHoursFromMidnight = curTime.get(Calendar.HOUR_OF_DAY);
                int numMinutesFromHour = curTime.get(Calendar.MINUTE);
                int numSecondsFromMin = curTime.get(Calendar.SECOND);
                int numSecondsFromMidnight = numSecondsFromMin + (60 * numMinutesFromHour) + (3600 * numHoursFromMidnight);

                if (stop.getArrivalTime() > numSecondsFromMidnight) {
                    stopsRemaining.add(stopDetailsListItemData);
                }
            }

            if (stopsRemaining.size() > 0) {
                stopDetailsAdapter.setStopsListItems(stopsRemaining);
            } else {
                stopTimer();
                for (EventHandler eventHandler : eventHandlers) {
                    eventHandler.onTripEnds();
                }
            }
        }
    }
}

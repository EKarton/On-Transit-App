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
    private final Timer timer;

    public StopDetailsRecyclerView(@NonNull Context context) {
        super(context);
        timer = new Timer();
    }

    public StopDetailsRecyclerView(@NonNull Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        timer = new Timer();
    }

    public StopDetailsRecyclerView(@NonNull Context context, @Nullable AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);
        timer = new Timer();
    }

    public void onAttachedToWindow() {
        final Handler handler = new Handler(getContext().getMainLooper());

        // Update the time remaining per second.
        timer.schedule(new TimerTask() {
            @Override
            public void run() {
            handler.post(new Runnable() {
                @Override
                public void run() {

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

                    stopDetailsAdapter.setStopsListItems(stopsRemaining);
                }
                }
            });
            }
        }, 0, 1000);

        super.onAttachedToWindow();
    }


    @Override
    public void onDetachedFromWindow() {
        timer.cancel();
        super.onDetachedFromWindow();
    }
}

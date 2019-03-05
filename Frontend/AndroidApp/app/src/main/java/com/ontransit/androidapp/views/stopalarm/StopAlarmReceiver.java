package com.ontransit.androidapp.views.stopalarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

public class StopAlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        Intent newIntent = new Intent(context, StopAlarmActivity.class);

        Bundle bundle = intent.getExtras();
        if (bundle != null) {
            newIntent.putExtras(bundle);
        }
        newIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        context.startActivity(newIntent);
    }
}

package com.kartonoe.ontransitapp.views;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class AlarmReciever extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        Intent newIntent = new Intent(context, MainActivity.class);

        newIntent.putExtra("lock", true);
        newIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        context.startActivity(newIntent);
    }
}

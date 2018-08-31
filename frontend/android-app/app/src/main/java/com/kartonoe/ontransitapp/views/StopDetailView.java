package com.kartonoe.ontransitapp.views;

import android.content.Context;
import android.support.constraint.ConstraintLayout;
import android.util.AttributeSet;
import android.widget.TextView;

import com.kartonoe.ontransitapp.R;
import com.kartonoe.ontransitapp.models.Stop;

public class StopDetailView extends ConstraintLayout {

    private TextView stopNameLabel;
    private TextView stopTimeValueLabel;
    private TextView stopTimeUnitLabel;
    private Stop stop;

    public StopDetailView(Context context){
        this(context, null);
    }

    public StopDetailView(Context context, AttributeSet attrs){
        this(context, attrs, 0);
    }

    public StopDetailView(Context context, AttributeSet attrs, int defStyleAttr){
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init(){

        // Set the resource
        inflate(getContext(), R.layout.route_details_view, this);

        // Get the UI elements
        this.stopNameLabel = this.findViewById(R.id.stopNameLabel);
        this.stopTimeValueLabel = this.findViewById(R.id.stopTimeValueLabel);
        this.stopTimeUnitLabel = this.findViewById(R.id.stopTimeValueLabel);

        // Make them hidden (as they have no data yet)
        this.stopNameLabel.setVisibility(GONE);
        this.stopTimeValueLabel.setVisibility(GONE);
        this.stopTimeUnitLabel.setVisibility(GONE);
    }

    public void setStop(Stop stop){
        this.stop = stop;

        // Update the UI
        if (this.stop.getName() != null){
            this.stopNameLabel.setVisibility(VISIBLE);
            this.stopNameLabel.setText(this.stop.getName());
        }
        else{
            this.stopNameLabel.setVisibility(GONE);
        }

        if (this.stop.getExpectedArrivalTime() != null){
            this.stopTimeValueLabel.setVisibility(VISIBLE);
            this.stopTimeValueLabel.setText(this.stop.getExpectedArrivalTime().toString());

            this.stopTimeUnitLabel.setVisibility(VISIBLE);
            this.stopTimeUnitLabel.setText("minutes");
        }
        else{
            this.stopTimeValueLabel.setVisibility(GONE);
            this.stopTimeUnitLabel.setVisibility(GONE);
        }
    }

    public Stop getStop(){
        return this.stop;
    }
}

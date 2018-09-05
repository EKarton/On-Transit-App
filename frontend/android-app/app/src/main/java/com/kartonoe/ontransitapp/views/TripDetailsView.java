package com.kartonoe.ontransitapp.views;

import android.content.Context;
import android.support.constraint.ConstraintLayout;
import android.util.AttributeSet;
import android.widget.TextView;

import com.kartonoe.ontransitapp.R;
import com.kartonoe.ontransitapp.models.Trip;

public class TripDetailsView extends ConstraintLayout {

    private Trip trip;
    private TextView routeShortNameLabel;
    private TextView routeLongNameLabel;
    private TextView routeDirectionsLabel;

    public TripDetailsView(Context context){
        this(context, null);
    }

    public TripDetailsView(Context context, AttributeSet attrs){
        this(context, attrs, 0);
    }

    public TripDetailsView(Context context, AttributeSet attrs, int defStyleAttr){
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init(){

        // Add the XML resource
        inflate(getContext(), R.layout.trip_details_view, this);

        // Get the UI components
        routeShortNameLabel = this.findViewById(R.id.tripShortNameLabel);
        routeLongNameLabel = this.findViewById(R.id.tripLongNameLabel);
        routeDirectionsLabel = this.findViewById(R.id.tripDirectionLabel);

        // Initially the UI components are hidden because there is no data in them!
        routeShortNameLabel.setVisibility(GONE);
        routeLongNameLabel.setVisibility(GONE);
        routeDirectionsLabel.setVisibility(GONE);
    }

    public void setRoute(Trip trip){
        this.trip = trip;

        // Update the UI
        if (this.trip.getTripShortName() != null){
            this.routeShortNameLabel.setVisibility(VISIBLE);
            this.routeShortNameLabel.setText(this.trip.getTripShortName());
        }
        else{
            this.routeShortNameLabel.setVisibility(GONE);
        }

        if (this.trip.getTripLongName() != null){
            this.routeLongNameLabel.setVisibility(VISIBLE);
            this.routeLongNameLabel.setText(this.trip.getTripLongName());
        }
        else{
            this.routeLongNameLabel.setVisibility(GONE);
        }

        if (this.trip.getTripDirection() != null){
            this.routeDirectionsLabel.setVisibility(VISIBLE);
            this.routeDirectionsLabel.setText(this.trip.getTripDirection());
        }
        else{
            this.routeDirectionsLabel.setVisibility(GONE);
        }
    }

    public Trip getRoute(){
        return this.trip;
    }
}

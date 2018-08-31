package com.kartonoe.ontransitapp.views;

import android.content.Context;
import android.support.constraint.ConstraintLayout;
import android.util.AttributeSet;
import android.widget.TextView;

import com.kartonoe.ontransitapp.R;
import com.kartonoe.ontransitapp.models.Route;

public class RouteDetailsView extends ConstraintLayout {

    private Route route;
    private TextView routeShortNameLabel;
    private TextView routeLongNameLabel;
    private TextView routeDirectionsLabel;

    public RouteDetailsView(Context context){
        this(context, null);
    }

    public RouteDetailsView(Context context, AttributeSet attrs){
        this(context, attrs, 0);
    }

    public RouteDetailsView(Context context, AttributeSet attrs, int defStyleAttr){
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init(){

        // Add the XML resource
        inflate(getContext(), R.layout.route_details_view, this);

        // Get the UI components
        routeShortNameLabel = this.findViewById(R.id.routeShortNameLabel);
        routeLongNameLabel = this.findViewById(R.id.routeLongNameLabel);
        routeDirectionsLabel = this.findViewById(R.id.routeDirectionLabel);

        // Initially the UI components are hidden because there is no data in them!
        routeShortNameLabel.setVisibility(GONE);
        routeLongNameLabel.setVisibility(GONE);
        routeDirectionsLabel.setVisibility(GONE);
    }

    public void setRoute(Route route){
        this.route = route;

        // Update the UI
        if (this.route.getRouteShortName() != null){
            this.routeShortNameLabel.setVisibility(VISIBLE);
            this.routeShortNameLabel.setText(this.route.getRouteShortName());
        }
        else{
            this.routeShortNameLabel.setVisibility(GONE);
        }

        if (this.route.getRouteLongName() != null){
            this.routeLongNameLabel.setVisibility(VISIBLE);
            this.routeLongNameLabel.setText(this.route.getRouteLongName());
        }
        else{
            this.routeLongNameLabel.setVisibility(GONE);
        }

        if (this.route.getRouteDirection() != null){
            this.routeDirectionsLabel.setVisibility(VISIBLE);
            this.routeDirectionsLabel.setText(this.route.getRouteDirection());
        }
        else{
            this.routeDirectionsLabel.setVisibility(GONE);
        }
    }

    public Route getRoute(){
        return this.route;
    }
}

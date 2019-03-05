package com.ontransit.androidapp.models;

public class NearbyTrip {
    private String tripID;
    private String shortName;
    private String longName;
    private String headSign;
    private String type;
    private String scheduleID;

    public NearbyTrip(String tripID, String shortName, String longName, String headSign, String type, String scheduleID) {
        this.tripID = tripID;
        this.shortName = shortName;
        this.longName = longName;
        this.headSign = headSign;
        this.type = type;
        this.scheduleID = scheduleID;
    }

    public String getTripID() {
        return tripID;
    }

    public String getShortName() {
        return shortName;
    }

    public String getLongName() {
        return longName;
    }

    public String getHeadSign() {
        return headSign;
    }

    public String getType() {
        return type;
    }

    public void setTripID(String tripID) {
        this.tripID = tripID;
    }

    public void setShortName(String shortName) {
        this.shortName = shortName;
    }

    public void setLongName(String longName) {
        this.longName = longName;
    }

    public void setHeadSign(String headSign) {
        this.headSign = headSign;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getScheduleID() {
        return scheduleID;
    }

    public void setScheduleID(String scheduleID) {
        this.scheduleID = scheduleID;
    }
}

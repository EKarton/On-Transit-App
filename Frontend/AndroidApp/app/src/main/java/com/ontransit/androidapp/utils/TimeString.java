package com.ontransit.androidapp.utils;

public class TimeString {
    private String value;
    private String units;


    public TimeString(String value, String units) {
        this.value = value;
        this.units = units;
    }

    public String getValue() {
        return value;
    }

    public String getUnits() {
        return units;
    }
}

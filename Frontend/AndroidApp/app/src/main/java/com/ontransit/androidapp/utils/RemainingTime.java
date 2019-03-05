package com.ontransit.androidapp.utils;

public class RemainingTime {
    private String value;
    private String units;


    public RemainingTime(String value, String units) {
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

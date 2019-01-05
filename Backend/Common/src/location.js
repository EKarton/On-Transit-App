"use strict";

class Location{
    constructor(latitude, longitude){
        this._latitude = latitude;
        this._longitude = longitude;
    }

    get latitude(){
        return this._latitude;
    }

    set latitude(newLatitude){
        this._latitude = newLatitude;
    }

    get longitude(){
        return this._longitude;
    }

    set longitude(newLongitude){
        this._longitude = newLongitude;
    }
}

module.exports = Location;
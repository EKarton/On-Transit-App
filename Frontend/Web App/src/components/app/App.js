import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import "./App.css";
import Map from "../map-view/MapView";
import RouteDetailsView from '../route-details-view/RouteDetailsView.js';
import RouteChooserPopup from "../route-chooser-popup/RouteChooserPopup";
import { getFormattedTime, getTimeInSeconds } from "../../services/TimeFormatter";

import {getCurrentTime} from "../../services/TimeService";

import MockedOnTransitService from '../../services/OnTransitService.js';

import {GetLocationOnPath} from "../../services/LocationTracker";
import EndOfRoutePopup from '../end-of-route-popup/end-of-route-popup';

class App extends React.Component {
    state = {
        displayRouteChoices: false,
        displayRouteDetails: false,
        displayEndOfRouteMessage: false,
        mapZoom: 3,
        curLocation: {
            latitude: 43.554028,
            longitude: -79.722099
        },
        initLocation: {
            latitude: 0,
            longitude: 0
        },
        possibleRoutes: [],
        tripDetailsID: null,
        tripDetails: {
            shortName: null,
            longName: null,
            path: [],
            stops: []
        },
        alarms: {}
    }

    async componentDidMount(){
        this.onTransitService = new MockedOnTransitService();	
        
        
        if (!("Notification" in window)){
            alert("Notifications are not supported in this browser!");
        }

        Notification.requestPermission();

        this.startGeolocationWatch();
        this.startAlarmWatch();
    }

    restartApp = () => {
        this.componentWillUnmount();
        this.setState((prevState, props) => {
            return {
                displayRouteChoices: false,
                displayRouteDetails: false,
                displayEndOfRouteMessage: false,
                mapZoom: 3,
                curLocation: {
                    latitude: 43.554028,
                    longitude: -79.722099
                },
                initLocation: {
                    latitude: 0,
                    longitude: 0
                },
                possibleRoutes: [],
                tripDetailsID: null,
                tripDetails: {
                    shortName: null,
                    longName: null,
                    path: [],
                    stops: []
                },
                alarms: {}
            };
        });
        this.componentDidMount();
    }

    startGeolocationWatch = () => {
        // Initialize and watch the location
        let geolocationOptions = {
            enableHighAccuracy: true,
            timeout: Infinity,
            maximumAge: 0
        };

        if (navigator.geolocation){
            this.geolocationWatch = navigator.geolocation.watchPosition(
                this.onLocationChangedSuccess, this.onLocationChangedError, geolocationOptions);
        }
    };

    startPredictedLocationWatch = () => {
        if (this.state.tripDetails.stops.length > 1){
            this.liveLocationWatch = setInterval(() => {
                let stops = this.state.tripDetails.stops;
                let path = this.state.tripDetails.path;
                let currentTimeInSeconds = getTimeInSeconds(getCurrentTime());
                let lastStop = stops[stops.length - 1];

                if (currentTimeInSeconds >= lastStop.time){
                    this.setState((prevState, props) => {
                        return {
                            ...prevState,
                            displayEndOfRouteMessage: true,
                            displayRouteDetails: false
                        };
                    });
                }
                else{
                    let predictedLocation = GetLocationOnPath(stops, path, currentTimeInSeconds);

                    this.setState((prevState, props) => {
                        return {
                            ...prevState,
                            curLocation: {
                                latitude: predictedLocation.lat,
                                longitude: predictedLocation.long
                            }
                        };
                    });
                }
            });
        }
    }

    startAlarmWatch = () => {
        this.alarmInterval = setInterval(() => {
            var curTimeInSeconds = getTimeInSeconds(getCurrentTime());

            Object.keys(this.state.alarms).forEach(stopID => {
                // Get the stop detail for that stopID
                let stopDetails = this.state.tripDetails.stops.find(stop => {
                    return stop.ID == stopID;
                });

                if (stopDetails !== undefined){
                    let alarmDetails = this.state.alarms[stopID];
                    let remainingTimeLeft = stopDetails.time - curTimeInSeconds;

                    if (remainingTimeLeft < alarmDetails.minRemainingTimeLeft && !alarmDetails.isDispatched){
                        console.log("RING RING RING!!!");
                        this.dispatchAlarm(stopDetails);
                        this.removeAlarm(stopID);
                    }
                }
                else{
                    throw new Error("Inconsistency with stop ID " + stopID + " and trip details!");
                }
            });
        });
    }

    stopAlarmWatch = () => {
        if (this.alarmInterval){
            clearInterval(this.alarmInterval);
        }
    }

    stopLiveLocationWatch = () => {
        if (this.liveLocationWatch){
            clearInterval(this.liveLocationWatch);
        }
    }

    stopGeolocationWatch = () => {
        navigator.geolocation.clearWatch(this.geolocationWatch);
    }

    componentWillUnmount(){
        this.stopAlarmWatch();
        this.stopLiveLocationWatch();
        this.stopGeolocationWatch();       
    }

    onLocationChangedSuccess = (position) => {
        let latitude = position.coords.latitude;
        let longitude = position.coords.longitude;
        let radius = position.coords.accuracy;
        let time = new Date().toLocaleTimeString();

        if (this.state.tripDetailsID === null){

            // Get the nearby trips and vehicles
            let nearbyTripsPromise = this.onTransitService.getNearbyTrips(latitude, longitude, time, radius);
            let nearbyVehiclesPromise = this.onTransitService.getNearbyVehicles(latitude, longitude, radius);
            
            Promise.all([nearbyTripsPromise, nearbyVehiclesPromise])
                .then(values => {     

                    console.log(Object.keys(values[0].tripIDs));
                    
                    let nearbyTrips = Object.keys(values[0].tripIDs).map(key => {
                        let tripID = key;
                        let tripDetails = values[0].tripIDs[tripID];
                        return {
                            ...tripDetails, 
                            tripID: tripID
                        };
                    });

                    console.log(nearbyTrips);

                    this.setState((prevState, props) => {
                        return {
                            ...prevState,
                            displayRouteChoices: true,
                            possibleRoutes: nearbyTrips,
                            curLocation: {
                                latitude: latitude,
                                longitude: longitude
                            }
                        };
                    });

                    
                })
                .catch(errors => {
                    console.log(errors);
                });
        }
    }

    onLocationChangedError = (error) => {
        console.log("ERROR!");
        console.log(error);
    }

    selectRoute = (tripID) => {
        let selectedTripID = this.state.possibleRoutes.find(trip => trip.tripID === tripID);
        console.log("Selected Trip ID: " + selectedTripID);
        if (this.state.tripDetailsID !== selectedTripID){
            this.onTransitService.getTripDetails(selectedTripID)
                .then(results => {

                    // Set the ID of results to their index
                    results.stops = results.stops.map((item, index) => {
                        return {
                            ...item,
                            ID: index
                        };
                    });

                    // Get the midpoint between all the path locations
                    let sumOfAllPathLatitudes = results.path.reduce((curSum, item) => curSum + item.lat, 0);
                    let sumOfAllPathLongitudes = results.path.reduce((curSum, item) => curSum + item.long, 0);
                    let midPathLatitude = sumOfAllPathLatitudes / results.path.length;
                    let midPathLongitude = sumOfAllPathLongitudes / results.path.length;

                    this.setState((prevState, props) => {
                        return {
                            ...prevState,
                            initLocation: {
                                latitude: midPathLatitude,
                                longitude: midPathLongitude
                            },
                            tripDetailsID: selectedTripID,
                            displayRouteDetails: true,
                            displayRouteChoices: false,
                            tripDetails: results,
                            mapZoom: 13,
                            alarms: {}
                        };
                    }, () => {
                        this.startPredictedLocationWatch();
                    });
                })
                .catch(error => {
                    console.log(error);
                });
        }
    }

    addNewAlarm = (stopID) => {

        if (this.state.tripDetails.stops[stopID.toString()]){
            this.setState((prevState, props) => {
                let newAlarms = prevState.alarms;
                newAlarms[stopID] = { 
                    minRemainingTimeLeft: 300, //<- 300 seconds is 5 minutes
                    isDispatched: false
                }; 

                // Display a toast message to the user that an alarm is added.
                let stopDetails = this.state.tripDetails.stops[stopID.toString()];
                let toastMessage = "You will be notified 5 minutes before reaching " + stopDetails.name;
                toast(toastMessage, {
                    position: toast.POSITION.BOTTOM_CENTER
                });
                console.log(toastMessage);

                return {
                    ...prevState,
                    alarms: newAlarms
                };
            });			
        }
        else{
            throw new Error("Inconsistencies with stopID " + stopID + " and this.state.tripDetails.stops");
        }
    }

    removeAlarm = (stopID) => {

        this.setState((prevState, props) => {
            delete prevState.alarms[stopID.toString()];

            // Display a toast message to the user that the notification is removed
            let stopDetails = this.state.tripDetails.stops[stopID.toString()];
            let toastMessage = "Removed notification for stop " + stopDetails.name;
            toast(toastMessage, {
                position: toast.POSITION.BOTTOM_CENTER
            });

            console.log(toastMessage);

            return prevState;
        });
        
        console.log("Removed alarm " + stopID);
    }

    dispatchNotification = (message, timeBeforeClosingNotification) => {
        // Notify the user via Web Notifications
        Notification.requestPermission()
            .then((permission) => {
                if (permission !== "granted"){
                    throw new Error("No access!");
                }
            })
            .then(() => {
                console.log("We have access here!");
                let notification = new Notification(message);

                // Close the notification after 10 seconds
                setTimeout(() => {
                    notification.close();
                }, timeBeforeClosingNotification);
            })
            .catch(error => {
                console.log("We have no access here!");
            });
    }

    dispatchAlarm = (stopDetails) => {
        // let curTimeInSeconds = getTimeInSeconds(new Date());
        let curTimeInSeconds = getTimeInSeconds(getCurrentTime());

        let numSecondsRemaining = stopDetails.time - curTimeInSeconds;
        let formattedTimeRemaining = getFormattedTime(numSecondsRemaining);
        let stopID = stopDetails.ID;

        let notificationContent = "You are " +  
            formattedTimeRemaining.value + " " + 
            formattedTimeRemaining.unit + " away from " + 
            stopDetails.name;

        this.dispatchNotification(notificationContent, 10000);

        this.setState((prevState, props) => {
            let newAlarms = prevState.alarms;
            newAlarms[stopID.toString()].isDispatched = true;

            return {
                ...prevState,
                alarms: newAlarms
            };
        });
    }
 
    render() {
        return (
            <div className="app-container">
                {
                    this.state.displayRouteDetails
                        ? <div className="left-panel">
                            <RouteDetailsView
                                tripShortName={this.state.tripDetails.shortName}
                                tripLongName={this.state.tripDetails.longName}
                                stops={this.state.tripDetails.stops}
                                alarms={this.state.alarms}
                                addNewAlarmHandler={this.addNewAlarm}
                                removeAlarmHandler={this.removeAlarm}/>
                          </div>
                        : null
                }
                <div className="right-panel">
                    <Map viewLocation={this.state.initLocation}
                         zoom={this.state.mapZoom}
                         currentLocation={this.state.curLocation}
                         path={this.state.tripDetails.path}
                         stops={this.state.tripDetails.stops} />
                </div>				
                {
                    this.state.displayRouteChoices 
                        ? <RouteChooserPopup 
                            routes={this.state.possibleRoutes}
                            onSelectRoute={this.selectRoute}/> 
                        : null 
                }	
                {
                    this.state.displayEndOfRouteMessage
                        ? <EndOfRoutePopup restartApp={this.restartApp}/>
                        : null
                }
                <ToastContainer />		
            </div>
        );
    }
}

export default App;